export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const STAMP_TYPES = ['city', 'perfect'] as const;
export type StampType = (typeof STAMP_TYPES)[number];

export const QUIZ_ATTEMPT_STATUSES = ['in_progress', 'completed', 'abandoned'] as const;
export type QuizAttemptStatus = (typeof QUIZ_ATTEMPT_STATUSES)[number];

export const QUIZ_STATUSES = [
  'not_started',
  'in_progress',
  'completed',
  'missed',
  'unavailable',
] as const;
export type QuizStatus = (typeof QUIZ_STATUSES)[number];

export const PASSPORT_SLOT_STATUSES = [
  'upcoming',
  'available_today',
  'collected',
  'perfect',
  'missed',
] as const;
export type PassportSlotStatus = (typeof PASSPORT_SLOT_STATUSES)[number];

export const ACCOUNT_TYPES = ['guest', 'registered'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const ERROR_CODES = [
  'CHALLENGE_NOT_FOUND',
  'CHALLENGE_NOT_AVAILABLE',
  'QUIZ_ALREADY_COMPLETED',
  'ANSWER_ALREADY_SUBMITTED',
  'QUESTION_NOT_IN_ATTEMPT',
  'OPTION_NOT_IN_QUESTION',
  'NOT_ALL_QUESTIONS_ANSWERED',
  'UNAUTHORIZED',
  'NETWORK_ERROR',
  'UNKNOWN_ERROR',
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];
