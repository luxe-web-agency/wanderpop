export const ANALYTICS_EVENTS = {
  APP_OPENED: 'app_opened',
  GUEST_CREATED: 'guest_created',
  TODAY_CHALLENGE_VIEWED: 'today_challenge_viewed',
  QUIZ_STARTED: 'quiz_started',
  QUIZ_RESUMED: 'quiz_resumed',
  QUESTION_ANSWERED: 'question_answered',
  QUIZ_COMPLETED: 'quiz_completed',
  CITY_STAMP_COLLECTED: 'city_stamp_collected',
  PERFECT_STAMP_COLLECTED: 'perfect_stamp_collected',
  PASSPORT_OPENED: 'passport_opened',
  STAMP_DETAIL_OPENED: 'stamp_detail_opened',
  SAVE_PROGRESS_PROMPT_SHOWN: 'save_progress_prompt_shown',
  SAVE_PROGRESS_PROMPT_DISMISSED: 'save_progress_prompt_dismissed',
  SIGNUP_STARTED: 'signup_started',
  SIGNUP_COMPLETED: 'signup_completed',
  GUEST_PROGRESS_MERGED: 'guest_progress_merged',
} as const;

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];
