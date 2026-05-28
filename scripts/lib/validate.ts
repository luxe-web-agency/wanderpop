import type { Difficulty } from '../../packages/shared';
import type { CsvFile } from './csv';

export type SeasonCsvRow = {
  slug: string;
  name: string;
  description: string;
  starts_on: string;
  ends_on: string;
  sort_order: string;
  is_active: string;
};

export type CityCsvRow = {
  slug: string;
  name: string;
  country: string;
  region: string;
  timezone_hint: string;
  short_description: string;
  stamp_image_url: string;
  stamp_silhouette_url: string;
  is_published: string;
};

export type DailyChallengeCsvRow = {
  challenge_date: string;
  season_slug: string;
  city_slug: string;
  sort_order: string;
  is_published: string;
};

export type QuestionCsvRow = {
  city_slug: string;
  challenge_date: string;
  question_order: string;
  difficulty: string;
  question_text: string;
  fun_fact: string;
  is_published: string;
};

export type QuestionOptionCsvRow = {
  city_slug: string;
  challenge_date: string;
  question_order: string;
  option_order: string;
  option_text: string;
  is_correct: string;
};

export type ContentCsvFiles = {
  seasons: CsvFile<SeasonCsvRow>;
  cities: CsvFile<CityCsvRow>;
  challenges: CsvFile<DailyChallengeCsvRow>;
  questions: CsvFile<QuestionCsvRow>;
  options: CsvFile<QuestionOptionCsvRow>;
};

const VALID_DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const challengeKey = (citySlug: string, challengeDate: string) =>
  `${citySlug}|${challengeDate}`;

const questionKey = (
  citySlug: string,
  challengeDate: string,
  questionOrder: string,
) => `${challengeKey(citySlug, challengeDate)}|${questionOrder}`;

function hasDateFormat(value: string) {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

function isBoolean(value: string) {
  return value === 'true' || value === 'false';
}

function isPositiveInteger(value: string) {
  return /^[1-9]\d*$/.test(value);
}

function addDuplicateErrors(
  errors: string[],
  values: string[],
  label: string,
) {
  const seen = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      errors.push(`Duplicate ${label}: ${value}`);
    }

    seen.add(value);
  }
}

function requireColumns<T extends Record<string, string>>(
  file: CsvFile<T>,
  requiredColumns: string[],
  errors: string[],
) {
  const fieldSet = new Set(file.fields);

  for (const column of requiredColumns) {
    if (!fieldSet.has(column)) {
      errors.push(`${file.path} is missing required column: ${column}`);
    }
  }
}

function assertValid(errors: string[]) {
  if (errors.length > 0) {
    throw new Error(`Content validation failed:\n- ${errors.join('\n- ')}`);
  }
}

export function validateContent(files: ContentCsvFiles) {
  const errors: string[] = [];

  validateSeasons(files.seasons, errors);
  validateCities(files.cities, errors);
  validateDailyChallenges(files.challenges, files.seasons, files.cities, errors);
  validateQuestions(files.questions, files.challenges, files.cities, errors);
  validateQuestionOptions(files.options, files.questions, errors);

  assertValid(errors);
}

export function validateSeasons(
  seasons: CsvFile<SeasonCsvRow>,
  errors: string[],
) {
  requireColumns(
    seasons,
    ['slug', 'name', 'description', 'starts_on', 'ends_on', 'sort_order', 'is_active'],
    errors,
  );

  addDuplicateErrors(errors, seasons.rows.map((row) => row.slug), 'season slug');

  seasons.rows.forEach((row, index) => {
    const label = `season row ${index + 2}`;

    if (!SLUG_PATTERN.test(row.slug)) {
      errors.push(`${label}: slug must be lowercase and URL-safe`);
    }

    if (!row.name) {
      errors.push(`${label}: name is required`);
    }

    if (!hasDateFormat(row.starts_on)) {
      errors.push(`${label}: starts_on must be YYYY-MM-DD`);
    }

    if (row.ends_on && !hasDateFormat(row.ends_on)) {
      errors.push(`${label}: ends_on must be YYYY-MM-DD when present`);
    }

    if (row.ends_on && row.ends_on < row.starts_on) {
      errors.push(`${label}: ends_on must be after starts_on`);
    }

    if (!isPositiveInteger(row.sort_order)) {
      errors.push(`${label}: sort_order must be a positive integer`);
    }

    if (!isBoolean(row.is_active)) {
      errors.push(`${label}: is_active must be true or false`);
    }
  });
}

export function validateCities(cities: CsvFile<CityCsvRow>, errors: string[]) {
  requireColumns(
    cities,
    [
      'slug',
      'name',
      'country',
      'region',
      'timezone_hint',
      'short_description',
      'stamp_image_url',
      'stamp_silhouette_url',
      'is_published',
    ],
    errors,
  );

  addDuplicateErrors(errors, cities.rows.map((row) => row.slug), 'city slug');

  cities.rows.forEach((row, index) => {
    const label = `city row ${index + 2}`;

    if (!SLUG_PATTERN.test(row.slug)) {
      errors.push(`${label}: slug must be lowercase and URL-safe`);
    }

    if (!isBoolean(row.is_published)) {
      errors.push(`${label}: is_published must be true or false`);
    }

    if (row.is_published === 'true' && (!row.name || !row.country)) {
      errors.push(`${label}: published cities require name and country`);
    }
  });
}

export function validateDailyChallenges(
  challenges: CsvFile<DailyChallengeCsvRow>,
  seasons: CsvFile<SeasonCsvRow>,
  cities: CsvFile<CityCsvRow>,
  errors: string[],
) {
  requireColumns(
    challenges,
    ['challenge_date', 'season_slug', 'city_slug', 'sort_order', 'is_published'],
    errors,
  );

  const seasonSlugs = new Set(seasons.rows.map((row) => row.slug));
  const publishedCitySlugs = new Set(
    cities.rows
      .filter((row) => row.is_published === 'true')
      .map((row) => row.slug),
  );
  const citySlugs = new Set(cities.rows.map((row) => row.slug));

  addDuplicateErrors(
    errors,
    challenges.rows.map((row) => row.challenge_date),
    'challenge date',
  );

  addDuplicateErrors(
    errors,
    challenges.rows.map((row) => `${row.season_slug}|${row.sort_order}`),
    'season sort order',
  );

  challenges.rows.forEach((row, index) => {
    const label = `daily challenge row ${index + 2}`;

    if (!hasDateFormat(row.challenge_date)) {
      errors.push(`${label}: challenge_date must be YYYY-MM-DD`);
    }

    if (!seasonSlugs.has(row.season_slug)) {
      errors.push(`${label}: unknown season_slug ${row.season_slug}`);
    }

    if (!citySlugs.has(row.city_slug)) {
      errors.push(`${label}: unknown city_slug ${row.city_slug}`);
    }

    if (!isPositiveInteger(row.sort_order)) {
      errors.push(`${label}: sort_order must be a positive integer`);
    }

    if (!isBoolean(row.is_published)) {
      errors.push(`${label}: is_published must be true or false`);
    }

    if (row.is_published === 'true' && !publishedCitySlugs.has(row.city_slug)) {
      errors.push(`${label}: published challenge requires a published city`);
    }
  });
}

export function validateQuestions(
  questions: CsvFile<QuestionCsvRow>,
  challenges: CsvFile<DailyChallengeCsvRow>,
  cities: CsvFile<CityCsvRow>,
  errors: string[],
) {
  requireColumns(
    questions,
    [
      'city_slug',
      'challenge_date',
      'question_order',
      'difficulty',
      'question_text',
      'fun_fact',
      'is_published',
    ],
    errors,
  );

  const citySlugs = new Set(cities.rows.map((row) => row.slug));
  const challengeKeys = new Set(
    challenges.rows.map((row) => challengeKey(row.city_slug, row.challenge_date)),
  );

  addDuplicateErrors(
    errors,
    questions.rows.map((row) =>
      questionKey(row.city_slug, row.challenge_date, row.question_order),
    ),
    'question order per challenge',
  );

  questions.rows.forEach((row, index) => {
    const label = `question row ${index + 2}`;

    if (!citySlugs.has(row.city_slug)) {
      errors.push(`${label}: unknown city_slug ${row.city_slug}`);
    }

    if (!challengeKeys.has(challengeKey(row.city_slug, row.challenge_date))) {
      errors.push(
        `${label}: no matching daily challenge for ${row.city_slug} on ${row.challenge_date}`,
      );
    }

    if (!isPositiveInteger(row.question_order)) {
      errors.push(`${label}: question_order must be a positive integer`);
    }

    if (!VALID_DIFFICULTIES.includes(row.difficulty as Difficulty)) {
      errors.push(`${label}: difficulty must be easy, medium, or hard`);
    }

    if (!row.question_text) {
      errors.push(`${label}: question_text is required`);
    }

    if (!row.fun_fact) {
      errors.push(`${label}: fun_fact is required`);
    }

    if (!isBoolean(row.is_published)) {
      errors.push(`${label}: is_published must be true or false`);
    }
  });

  for (const challenge of challenges.rows.filter((row) => row.is_published === 'true')) {
    const questionCount = questions.rows.filter(
      (row) =>
        row.city_slug === challenge.city_slug
        && row.challenge_date === challenge.challenge_date
        && row.is_published === 'true',
    ).length;

    if (questionCount === 0) {
      errors.push(
        `published challenge ${challenge.city_slug} on ${challenge.challenge_date} has no published questions`,
      );
    }
  }
}

export function validateQuestionOptions(
  options: CsvFile<QuestionOptionCsvRow>,
  questions: CsvFile<QuestionCsvRow>,
  errors: string[],
) {
  requireColumns(
    options,
    [
      'city_slug',
      'challenge_date',
      'question_order',
      'option_order',
      'option_text',
      'is_correct',
    ],
    errors,
  );

  const questionKeys = new Set(
    questions.rows.map((row) =>
      questionKey(row.city_slug, row.challenge_date, row.question_order),
    ),
  );

  addDuplicateErrors(
    errors,
    options.rows.map((row) =>
      `${questionKey(row.city_slug, row.challenge_date, row.question_order)}|${row.option_order}`,
    ),
    'option order per question',
  );

  const correctCounts = new Map<string, number>();

  options.rows.forEach((row, index) => {
    const label = `question option row ${index + 2}`;
    const key = questionKey(row.city_slug, row.challenge_date, row.question_order);

    if (!questionKeys.has(key)) {
      errors.push(`${label}: no matching question for ${key}`);
    }

    if (!isPositiveInteger(row.option_order)) {
      errors.push(`${label}: option_order must be a positive integer`);
    }

    if (!row.option_text) {
      errors.push(`${label}: option_text is required`);
    }

    if (!isBoolean(row.is_correct)) {
      errors.push(`${label}: is_correct must be true or false`);
    }

    if (row.is_correct === 'true') {
      correctCounts.set(key, (correctCounts.get(key) ?? 0) + 1);
    }
  });

  for (const key of questionKeys) {
    const correctCount = correctCounts.get(key) ?? 0;

    if (correctCount !== 1) {
      errors.push(`${key}: expected exactly one correct option, found ${correctCount}`);
    }
  }
}
