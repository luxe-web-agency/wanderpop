import type {
  AccountType,
  Difficulty,
  QuizAttemptStatus,
  StampType,
} from './enums';

export type LocalDate = string;
export type Uuid = string;
export type IsoTimestamp = string;

export type Profile = {
  id: Uuid;
  display_name: string | null;
  account_type: AccountType;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
  last_seen_at: IsoTimestamp | null;
  preferred_language: string;
};

export type Season = {
  id: Uuid;
  slug: string;
  name: string;
  description: string | null;
  starts_on: LocalDate;
  ends_on: LocalDate | null;
  sort_order: number;
  is_active: boolean;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
};

export type City = {
  id: Uuid;
  slug: string;
  name: string;
  country: string;
  region: string | null;
  timezone_hint: string | null;
  short_description: string | null;
  stamp_image_url: string | null;
  stamp_silhouette_url: string | null;
  is_published: boolean;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
};

export type DailyChallenge = {
  id: Uuid;
  season_id: Uuid;
  city_id: Uuid;
  challenge_date: LocalDate;
  sort_order: number;
  is_published: boolean;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
};

export type Question = {
  id: Uuid;
  daily_challenge_id: Uuid;
  city_id: Uuid;
  question_order: number;
  difficulty: Difficulty;
  question_text: string;
  fun_fact: string;
  is_published: boolean;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
};

export type QuestionOption = {
  id: Uuid;
  question_id: Uuid;
  option_order: number;
  option_text: string;
  is_correct: boolean;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
};

export type QuizAttempt = {
  id: Uuid;
  user_id: Uuid;
  daily_challenge_id: Uuid;
  local_date: LocalDate;
  timezone: string | null;
  status: QuizAttemptStatus;
  started_at: IsoTimestamp;
  completed_at: IsoTimestamp | null;
  score: number | null;
  total_questions: number | null;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
};

export type QuizAnswer = {
  id: Uuid;
  quiz_attempt_id: Uuid;
  question_id: Uuid;
  selected_option_id: Uuid;
  is_correct: boolean;
  answered_at: IsoTimestamp;
  created_at: IsoTimestamp;
};

export type UserStamp = {
  id: Uuid;
  user_id: Uuid;
  season_id: Uuid;
  city_id: Uuid;
  daily_challenge_id: Uuid;
  quiz_attempt_id: Uuid;
  stamp_type: StampType;
  collected_at: IsoTimestamp;
  local_date: LocalDate;
  score: number;
  total_questions: number;
  created_at: IsoTimestamp;
};

export type UserStreak = {
  user_id: Uuid;
  current_streak: number;
  longest_streak: number;
  last_completed_local_date: LocalDate | null;
  updated_at: IsoTimestamp;
};
