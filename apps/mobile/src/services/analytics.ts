import { ANALYTICS_EVENTS, type AnalyticsEventName, type Difficulty, type QuizStatus } from '@wanderpop/shared';

type AnalyticsValue = string | number | boolean;
type AnalyticsProperties = Record<string, AnalyticsValue>;

type AppUserType = 'guest' | 'registered';
type SaveProgressTrigger = 'first_stamp' | 'perfect_stamp' | 'passport_open' | 'streak_milestone' | 'manual_account_open';
type SignupMethod = 'email_magic_link';
type SignupTrigger = 'save_progress_prompt' | 'manual_account_open';

export type AnalyticsEventProperties = {
  [ANALYTICS_EVENTS.APP_OPENED]: {
    user_type: AppUserType;
    local_date: string;
  };
  [ANALYTICS_EVENTS.GUEST_CREATED]: {
    local_date: string;
  };
  [ANALYTICS_EVENTS.TODAY_CHALLENGE_VIEWED]: {
    city_slug: string;
    season_slug: string;
    challenge_date: string;
    quiz_status: QuizStatus;
  };
  [ANALYTICS_EVENTS.QUIZ_STARTED]: {
    city_slug: string;
    season_slug: string;
    challenge_date: string;
    total_questions: number;
  };
  [ANALYTICS_EVENTS.QUIZ_RESUMED]: {
    city_slug: string;
    challenge_date: string;
    answered_count: number;
    total_questions: number;
  };
  [ANALYTICS_EVENTS.QUESTION_ANSWERED]: {
    city_slug: string;
    challenge_date: string;
    question_order: number;
    difficulty: Difficulty;
    is_correct: boolean;
  };
  [ANALYTICS_EVENTS.QUIZ_COMPLETED]: {
    city_slug: string;
    season_slug: string;
    challenge_date: string;
    score: number;
    total_questions: number;
    is_perfect: boolean;
  };
  [ANALYTICS_EVENTS.CITY_STAMP_COLLECTED]: {
    city_slug: string;
    season_slug: string;
    challenge_date: string;
    score: number;
    total_questions: number;
  };
  [ANALYTICS_EVENTS.PERFECT_STAMP_COLLECTED]: {
    city_slug: string;
    season_slug: string;
    challenge_date: string;
    score: number;
    total_questions: number;
  };
  [ANALYTICS_EVENTS.PASSPORT_OPENED]: {
    season_slug: string;
    collected_count: number;
    perfect_count: number;
    missed_count: number;
  };
  [ANALYTICS_EVENTS.SAVE_PROGRESS_PROMPT_SHOWN]: {
    trigger: SaveProgressTrigger;
    user_type: 'guest';
  };
  [ANALYTICS_EVENTS.SAVE_PROGRESS_PROMPT_DISMISSED]: {
    trigger: SaveProgressTrigger;
  };
  [ANALYTICS_EVENTS.SIGNUP_STARTED]: {
    method: SignupMethod;
    trigger: SignupTrigger;
  };
  [ANALYTICS_EVENTS.SIGNUP_COMPLETED]: {
    method: SignupMethod;
    had_guest_progress: boolean;
  };
  [ANALYTICS_EVENTS.STAMP_DETAIL_OPENED]: {
    city_slug: string;
    season_slug: string;
    status: string;
  };
  [ANALYTICS_EVENTS.GUEST_PROGRESS_MERGED]: {
    stamps_merged: number;
    attempts_merged: number;
    conflicts_resolved: number;
  };
};

type AnalyticsAdapter = {
  track: (eventName: AnalyticsEventName, properties: AnalyticsProperties) => void;
};

const analyticsAdapter: AnalyticsAdapter = __DEV__
  ? {
      track(eventName, properties) {
        console.info('[analytics]', eventName, properties);
      },
    }
  : {
      track() {},
    };

function sanitizeProperties(
  properties: Record<string, AnalyticsValue | null | undefined>,
): AnalyticsProperties {
  const sanitized: AnalyticsProperties = {};

  for (const [key, value] of Object.entries(properties)) {
    if (value !== null && value !== undefined && value !== '') {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export function trackAnalyticsEvent<Name extends AnalyticsEventName>(
  eventName: Name,
  properties: AnalyticsEventProperties[Name],
) {
  analyticsAdapter.track(eventName, sanitizeProperties(properties));
}
