import type {
  Difficulty,
  ErrorCode,
  PassportSlotStatus,
  QuizStatus,
  StampType,
} from './enums';
import type { IsoTimestamp, LocalDate, Uuid } from './entities';

export type LocalDateContext = {
  local_date: LocalDate;
  timezone: string;
};

export type ApiError = {
  code: ErrorCode;
  message: string;
};

export type ApiErrorResponse = {
  error: ApiError;
};

export type ChallengeSeasonSummary = {
  id: Uuid;
  slug: string;
  name: string;
};

export type ChallengeCitySummary = {
  id: Uuid;
  slug: string;
  name: string;
  country: string;
  short_description: string | null;
  stamp_image_url: string | null;
  stamp_silhouette_url: string | null;
};

export type TodayChallengeResponse = {
  challenge: {
    id: Uuid;
    date: LocalDate;
    season: ChallengeSeasonSummary;
    city: ChallengeCitySummary;
  } | null;
  user_status: {
    quiz_status: QuizStatus;
    attempt_id: Uuid | null;
    answered_count: number;
    total_questions: number;
    stamp_type: StampType | null;
    score: number | null;
  };
};

export type GetTodayChallengeRequest = LocalDateContext;

export type StartQuizRequest = LocalDateContext & {
  daily_challenge_id: Uuid;
};

export type QuizQuestionOption = {
  id: Uuid;
  order: number;
  text: string;
};

export type QuizQuestion = {
  id: Uuid;
  order: number;
  difficulty: Difficulty;
  question_text: string;
  options: QuizQuestionOption[];
  answered: boolean;
  selected_option_id: Uuid | null;
};

export type StartQuizResponse = {
  attempt: {
    id: Uuid;
    status: 'in_progress' | 'completed';
    started_at: IsoTimestamp;
    answered_count: number;
    total_questions: number;
  };
  questions: QuizQuestion[];
};

export type SubmitAnswerRequest = LocalDateContext & {
  attempt_id: Uuid;
  question_id: Uuid;
  selected_option_id: Uuid;
};

export type SubmitAnswerResponse = {
  answer: {
    question_id: Uuid;
    selected_option_id: Uuid;
    is_correct: boolean;
    correct_option_id: Uuid;
    answered_at: IsoTimestamp;
  };
  feedback: {
    result: 'correct' | 'incorrect';
    fun_fact: string;
  };
  attempt: {
    id: Uuid;
    status: 'in_progress' | 'completed';
    answered_count: number;
    total_questions: number;
  };
};

export type CompleteQuizRequest = LocalDateContext & {
  attempt_id: Uuid;
};

export type CompleteQuizResponse = {
  attempt: {
    id: Uuid;
    status: 'completed';
    score: number;
    total_questions: number;
    completed_at: IsoTimestamp;
  };
  stamp: {
    id: Uuid;
    type: StampType;
    city_name: string;
    collected_at: IsoTimestamp;
  };
  streak: {
    current_streak: number;
    longest_streak: number;
    was_incremented: boolean;
  };
};

export type GetPassportRequest = LocalDateContext & {
  season_id: Uuid;
};

export type PassportSlot = {
  daily_challenge_id: Uuid;
  date: LocalDate;
  city: {
    id: Uuid;
    slug: string;
    name: string;
    country: string;
  };
  status: PassportSlotStatus;
  score: number | null;
  total_questions: number | null;
  stamp_type: StampType | null;
  collected_at: IsoTimestamp | null;
};

export type GetPassportResponse = {
  season: ChallengeSeasonSummary;
  streak: {
    current_streak: number;
    longest_streak: number;
  };
  slots: PassportSlot[];
};

export type GetStampDetailRequest = LocalDateContext & {
  daily_challenge_id: Uuid;
};

export type GetStampDetailResponse = {
  city: {
    name: string;
    country: string;
    short_description: string | null;
  };
  stamp: {
    status: PassportSlotStatus;
    type: StampType | null;
    score: number | null;
    total_questions: number | null;
    collected_at: IsoTimestamp | null;
  };
};
