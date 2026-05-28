import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { readCsv } from './lib/csv';
import { createSupabaseServiceClient } from './lib/db';
import {
  type CityCsvRow,
  type DailyChallengeCsvRow,
  type QuestionCsvRow,
  type QuestionOptionCsvRow,
  type SeasonCsvRow,
  validateContent,
} from './lib/validate';

const rootDir = process.cwd();
const contentDir = resolve(rootDir, 'content');
const localEnvPath = resolve(rootDir, '.env.local');

const isDryRun = process.argv.includes('--dry-run');

const toBoolean = (value: string) => value === 'true';
const toInteger = (value: string) => Number.parseInt(value, 10);
const nullIfEmpty = (value: string) => (value === '' ? null : value);
const challengeKey = (citySlug: string, challengeDate: string) =>
  `${citySlug}|${challengeDate}`;
const questionKey = (
  citySlug: string,
  challengeDate: string,
  questionOrder: string | number,
) => `${challengeKey(citySlug, challengeDate)}|${questionOrder}`;

function requireValue<T>(value: T | undefined, message: string): T {
  if (value === undefined) {
    throw new Error(message);
  }

  return value;
}

function loadEnvFile(path: string) {
  try {
    const contents = readFileSync(path, 'utf8');

    for (const line of contents.split(/\r?\n/)) {
      const trimmedLine = line.trim();

      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }

      const [rawKey, ...rawValueParts] = trimmedLine.split('=');
      const key = rawKey.trim();

      if (!key) {
        continue;
      }

      const rawValue = rawValueParts.join('=').trim();

      if (process.env[key] === undefined) {
        process.env[key] = rawValue;
      }
    }
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return;
    }

    throw error;
  }
}

async function main() {
  loadEnvFile(localEnvPath);

  const files = {
    seasons: await readCsv<SeasonCsvRow>(resolve(contentDir, 'seasons.csv')),
    cities: await readCsv<CityCsvRow>(resolve(contentDir, 'cities.csv')),
    challenges: await readCsv<DailyChallengeCsvRow>(
      resolve(contentDir, 'daily_challenges.csv'),
    ),
    questions: await readCsv<QuestionCsvRow>(resolve(contentDir, 'questions.csv')),
    options: await readCsv<QuestionOptionCsvRow>(
      resolve(contentDir, 'question_options.csv'),
    ),
  };

  validateContent(files);

  console.info(`Validated ${files.seasons.rows.length} season(s)`);
  console.info(`Validated ${files.cities.rows.length} city/cities`);
  console.info(`Validated ${files.challenges.rows.length} daily challenge(s)`);
  console.info(`Validated ${files.questions.rows.length} question(s)`);
  console.info(`Validated ${files.options.rows.length} option(s)`);

  if (isDryRun) {
    console.info('Dry run complete. No database writes performed.');
    return;
  }

  const supabase = createSupabaseServiceClient();

  const { data: seasonRows, error: seasonsError } = await supabase
    .from('seasons')
    .upsert(
      files.seasons.rows.map((row) => ({
        slug: row.slug,
        name: row.name,
        description: nullIfEmpty(row.description),
        starts_on: row.starts_on,
        ends_on: nullIfEmpty(row.ends_on),
        sort_order: toInteger(row.sort_order),
        is_active: toBoolean(row.is_active),
      })),
      { onConflict: 'slug' },
    )
    .select('id, slug');

  if (seasonsError) {
    throw seasonsError;
  }

  const seasonsBySlug = new Map(
    (seasonRows ?? []).map((row) => [row.slug as string, row.id as string]),
  );

  console.info(`Imported ${files.seasons.rows.length} season(s)`);

  const { data: cityRows, error: citiesError } = await supabase
    .from('cities')
    .upsert(
      files.cities.rows.map((row) => ({
        slug: row.slug,
        name: row.name,
        country: row.country,
        region: nullIfEmpty(row.region),
        timezone_hint: nullIfEmpty(row.timezone_hint),
        short_description: nullIfEmpty(row.short_description),
        stamp_image_url: nullIfEmpty(row.stamp_image_url),
        stamp_silhouette_url: nullIfEmpty(row.stamp_silhouette_url),
        is_published: toBoolean(row.is_published),
      })),
      { onConflict: 'slug' },
    )
    .select('id, slug');

  if (citiesError) {
    throw citiesError;
  }

  const citiesBySlug = new Map(
    (cityRows ?? []).map((row) => [row.slug as string, row.id as string]),
  );
  const citySlugsById = new Map(
    (cityRows ?? []).map((row) => [row.id as string, row.slug as string]),
  );

  console.info(`Imported ${files.cities.rows.length} city/cities`);

  const { data: challengeRows, error: challengesError } = await supabase
    .from('daily_challenges')
    .upsert(
      files.challenges.rows.map((row) => ({
        season_id: requireValue(
          seasonsBySlug.get(row.season_slug),
          `Missing season ID for ${row.season_slug}`,
        ),
        city_id: requireValue(
          citiesBySlug.get(row.city_slug),
          `Missing city ID for ${row.city_slug}`,
        ),
        challenge_date: row.challenge_date,
        sort_order: toInteger(row.sort_order),
        is_published: toBoolean(row.is_published),
      })),
      { onConflict: 'challenge_date' },
    )
    .select('id, challenge_date, city_id');

  if (challengesError) {
    throw challengesError;
  }

  const challengesByKey = new Map<string, string>();
  const challengeKeysById = new Map<string, string>();

  for (const row of challengeRows ?? []) {
    const citySlug = requireValue(
      citySlugsById.get(row.city_id as string),
      `Missing city slug for city ID ${row.city_id}`,
    );
    const key = challengeKey(citySlug, row.challenge_date as string);

    challengesByKey.set(key, row.id as string);
    challengeKeysById.set(row.id as string, key);
  }

  console.info(`Imported ${files.challenges.rows.length} daily challenge(s)`);

  const { data: questionRows, error: questionsError } = await supabase
    .from('questions')
    .upsert(
      files.questions.rows.map((row) => ({
        daily_challenge_id: requireValue(
          challengesByKey.get(challengeKey(row.city_slug, row.challenge_date)),
          `Missing challenge ID for ${row.city_slug} on ${row.challenge_date}`,
        ),
        city_id: requireValue(
          citiesBySlug.get(row.city_slug),
          `Missing city ID for ${row.city_slug}`,
        ),
        question_order: toInteger(row.question_order),
        difficulty: row.difficulty,
        question_text: row.question_text,
        fun_fact: row.fun_fact,
        is_published: toBoolean(row.is_published),
      })),
      { onConflict: 'daily_challenge_id,question_order' },
    )
    .select('id, daily_challenge_id, question_order');

  if (questionsError) {
    throw questionsError;
  }

  const questionsByKey = new Map<string, string>();

  for (const row of questionRows ?? []) {
    const baseKey = requireValue(
      challengeKeysById.get(row.daily_challenge_id as string),
      `Missing challenge key for challenge ID ${row.daily_challenge_id}`,
    );

    questionsByKey.set(
      `${baseKey}|${row.question_order as number}`,
      row.id as string,
    );
  }

  console.info(`Imported ${files.questions.rows.length} question(s)`);

  const { error: optionsError } = await supabase
    .from('question_options')
    .upsert(
      files.options.rows.map((row) => ({
        question_id: requireValue(
          questionsByKey.get(
            questionKey(row.city_slug, row.challenge_date, row.question_order),
          ),
          `Missing question ID for ${questionKey(
            row.city_slug,
            row.challenge_date,
            row.question_order,
          )}`,
        ),
        option_order: toInteger(row.option_order),
        option_text: row.option_text,
        is_correct: toBoolean(row.is_correct),
      })),
      { onConflict: 'question_id,option_order' },
    );

  if (optionsError) {
    throw optionsError;
  }

  console.info(`Imported ${files.options.rows.length} option(s)`);
  console.info('Done.');
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
