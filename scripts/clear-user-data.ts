import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { resolve } from 'node:path';
import { stdin as input, stdout as output } from 'node:process';

import { createSupabaseServiceClient } from './lib/db';

const rootDir = process.cwd();
const envPath = resolve(rootDir, '.env');
const localEnvPath = resolve(rootDir, '.env.local');
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ScriptOptions = {
  userId: string;
  dryRun: boolean;
  skipConfirmation: boolean;
};

type DeletionSummary = {
  userStamps: number;
  quizAttempts: number;
  quizAnswers: number;
  streakRowExists: boolean;
};

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

function printHelp() {
  console.info('Usage: npm run clear-user-data -- --user-id <uuid> [--dry-run] [--yes]');
  console.info('');
  console.info('Options:');
  console.info('  --user-id <uuid>   Supabase auth/profile user ID to clear');
  console.info('  --dry-run          Show what would be removed without writing');
  console.info('  --yes              Skip the DELETE confirmation prompt');
}

function parseArguments(argv: string[]): ScriptOptions {
  let userId: string | null = null;
  let dryRun = false;
  let skipConfirmation = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--dry-run') {
      dryRun = true;
      continue;
    }

    if (argument === '--yes') {
      skipConfirmation = true;
      continue;
    }

    if (argument === '--help' || argument === '-h') {
      printHelp();
      process.exit(0);
    }

    if (argument === '--user-id') {
      userId = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (argument.startsWith('--user-id=')) {
      userId = argument.slice('--user-id='.length);
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  if (!userId) {
    throw new Error('Missing required --user-id argument.');
  }

  if (!UUID_PATTERN.test(userId)) {
    throw new Error('The value passed to --user-id must be a valid UUID.');
  }

  return {
    userId,
    dryRun,
    skipConfirmation,
  };
}

function printSummary(userId: string, summary: DeletionSummary) {
  console.info(`User: ${userId}`);
  console.info(`- user_stamps: ${summary.userStamps}`);
  console.info(`- quiz_attempts: ${summary.quizAttempts}`);
  console.info(`- quiz_answers: ${summary.quizAnswers}`);
  console.info(`- user_streaks row: ${summary.streakRowExists ? 'will reset to zero' : 'will create/reset to zero'}`);
}

async function confirmDestructiveAction() {
  const readline = createInterface({ input, output });

  try {
    const answer = await readline.question('Type DELETE to continue: ');

    if (answer !== 'DELETE') {
      throw new Error('Cancelled. Confirmation text did not match DELETE.');
    }
  } finally {
    readline.close();
  }
}

async function getDeletionSummary(userId: string): Promise<DeletionSummary> {
  const supabase = createSupabaseServiceClient();

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle<{ id: string }>();

  if (profileError) {
    throw profileError;
  }

  if (!profile) {
    throw new Error(`No profile row exists for user ${userId}.`);
  }

  const { data: attempts, error: attemptsError } = await supabase
    .from('quiz_attempts')
    .select('id')
    .eq('user_id', userId)
    .returns<Array<{ id: string }>>();

  if (attemptsError) {
    throw attemptsError;
  }

  const attemptIds = (attempts ?? []).map((attempt) => attempt.id);

  const [{ count: stampCount, error: stampsError }, { data: streakRow, error: streakError }] =
    await Promise.all([
      supabase
        .from('user_stamps')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('user_streaks')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle<{ user_id: string }>(),
    ]);

  if (stampsError) {
    throw stampsError;
  }

  if (streakError) {
    throw streakError;
  }

  if (!attemptIds.length) {
    return {
      userStamps: stampCount ?? 0,
      quizAttempts: 0,
      quizAnswers: 0,
      streakRowExists: Boolean(streakRow),
    };
  }

  const { count: answerCount, error: answersError } = await supabase
    .from('quiz_answers')
    .select('*', { count: 'exact', head: true })
    .in('quiz_attempt_id', attemptIds);

  if (answersError) {
    throw answersError;
  }

  return {
    userStamps: stampCount ?? 0,
    quizAttempts: attemptIds.length,
    quizAnswers: answerCount ?? 0,
    streakRowExists: Boolean(streakRow),
  };
}

async function clearUserData(userId: string) {
  const supabase = createSupabaseServiceClient();

  const { data: attempts, error: attemptsError } = await supabase
    .from('quiz_attempts')
    .select('id')
    .eq('user_id', userId)
    .returns<Array<{ id: string }>>();

  if (attemptsError) {
    throw attemptsError;
  }

  const attemptIds = (attempts ?? []).map((attempt) => attempt.id);

  const { error: stampsDeleteError } = await supabase
    .from('user_stamps')
    .delete()
    .eq('user_id', userId);

  if (stampsDeleteError) {
    throw stampsDeleteError;
  }

  if (attemptIds.length) {
    const { error: answersDeleteError } = await supabase
      .from('quiz_answers')
      .delete()
      .in('quiz_attempt_id', attemptIds);

    if (answersDeleteError) {
      throw answersDeleteError;
    }
  }

  const { error: attemptsDeleteError } = await supabase
    .from('quiz_attempts')
    .delete()
    .eq('user_id', userId);

  if (attemptsDeleteError) {
    throw attemptsDeleteError;
  }

  const { error: streakResetError } = await supabase
    .from('user_streaks')
    .upsert(
      {
        user_id: userId,
        current_streak: 0,
        longest_streak: 0,
        last_completed_local_date: null,
      },
      { onConflict: 'user_id' },
    );

  if (streakResetError) {
    throw streakResetError;
  }
}

async function main() {
  loadEnvFile(localEnvPath);
  loadEnvFile(envPath);

  const options = parseArguments(process.argv.slice(2));
  const beforeSummary = await getDeletionSummary(options.userId);

  printSummary(options.userId, beforeSummary);

  if (options.dryRun) {
    console.info('Dry run complete. No database writes performed.');
    return;
  }

  if (!options.skipConfirmation) {
    await confirmDestructiveAction();
  }

  await clearUserData(options.userId);

  const afterSummary = await getDeletionSummary(options.userId);

  if (
    afterSummary.userStamps !== 0 ||
    afterSummary.quizAttempts !== 0 ||
    afterSummary.quizAnswers !== 0
  ) {
    throw new Error('Verification failed. Some user progress rows still remain.');
  }

  console.info('');
  console.info('User progress data cleared successfully.');
  printSummary(options.userId, afterSummary);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
