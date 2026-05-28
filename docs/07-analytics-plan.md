# WanderPop Analytics Plan

WanderPop should use Firebase Analytics from day one.

The early analytics goal is to understand retention, quiz completion, collection behavior, and account conversion.

## 1. Analytics Principles

- Track only what helps product decisions.
- Keep event names stable.
- Avoid sensitive personal data.
- Do not include full question text in analytics events.
- Prefer IDs/slugs and simple properties.
- Use a wrapper service so analytics can be changed later.

Recommended app wrapper:

```txt
services/analytics.ts
```

## 2. Primary MVP Questions

Analytics should answer:

- How many users open the app?
- How many start today’s quiz?
- How many complete today’s quiz?
- Where do users drop off?
- How many collect City Stamps?
- How many collect Perfect Stamps?
- How often do users open Passport?
- How often are save-progress prompts shown?
- How many users start and complete signup?
- How often do users return the next day?

## 3. Core Events

### `app_opened`

Triggered when app opens or returns to foreground after meaningful time.

Properties:

```json
{
  "user_type": "guest",
  "local_date": "2026-05-28"
}
```

### `guest_created`

Triggered when a silent guest account is created.

Properties:

```json
{
  "local_date": "2026-05-28"
}
```

### `today_challenge_viewed`

Triggered when the Home screen successfully shows today’s city.

Properties:

```json
{
  "city_slug": "seoul",
  "season_slug": "season-1",
  "challenge_date": "2026-05-28",
  "quiz_status": "not_started"
}
```

### `quiz_started`

Triggered when user starts a new quiz attempt.

Properties:

```json
{
  "city_slug": "seoul",
  "season_slug": "season-1",
  "challenge_date": "2026-05-28",
  "total_questions": 7
}
```

### `quiz_resumed`

Triggered when user resumes an in-progress quiz.

Properties:

```json
{
  "city_slug": "seoul",
  "challenge_date": "2026-05-28",
  "answered_count": 3,
  "total_questions": 7
}
```

### `question_answered`

Triggered after backend accepts an answer.

Properties:

```json
{
  "city_slug": "seoul",
  "challenge_date": "2026-05-28",
  "question_order": 1,
  "difficulty": "easy",
  "is_correct": true
}
```

Do not include full question text.

### `quiz_completed`

Triggered when the quiz is completed.

Properties:

```json
{
  "city_slug": "seoul",
  "season_slug": "season-1",
  "challenge_date": "2026-05-28",
  "score": 7,
  "total_questions": 7,
  "is_perfect": true
}
```

### `city_stamp_collected`

Triggered when a City Stamp is collected.

Properties:

```json
{
  "city_slug": "seoul",
  "season_slug": "season-1",
  "challenge_date": "2026-05-28",
  "score": 5,
  "total_questions": 7
}
```

### `perfect_stamp_collected`

Triggered when a Perfect Stamp is collected.

Properties:

```json
{
  "city_slug": "seoul",
  "season_slug": "season-1",
  "challenge_date": "2026-05-28",
  "score": 7,
  "total_questions": 7
}
```

### `passport_opened`

Triggered when user opens Passport.

Properties:

```json
{
  "season_slug": "season-1",
  "collected_count": 3,
  "perfect_count": 1,
  "missed_count": 1
}
```

### `stamp_detail_opened`

Triggered when user opens a city/stamp detail screen.

Properties:

```json
{
  "city_slug": "seoul",
  "season_slug": "season-1",
  "status": "perfect"
}
```

### `save_progress_prompt_shown`

Triggered when guest sees account prompt.

Properties:

```json
{
  "trigger": "first_stamp",
  "user_type": "guest"
}
```

Possible triggers:

```txt
first_stamp
perfect_stamp
passport_open
streak_milestone
manual_account_open
```

### `save_progress_prompt_dismissed`

Triggered when user dismisses prompt.

Properties:

```json
{
  "trigger": "first_stamp"
}
```

### `signup_started`

Triggered when user starts sign-in/sign-up.

Properties:

```json
{
  "method": "email_magic_link",
  "trigger": "save_progress_prompt"
}
```

### `signup_completed`

Triggered when user successfully completes sign-in/sign-up.

Properties:

```json
{
  "method": "email_magic_link",
  "had_guest_progress": true
}
```

### `guest_progress_merged`

Triggered when guest progress merges into registered account.

Properties:

```json
{
  "stamps_merged": 3,
  "attempts_merged": 1,
  "conflicts_resolved": 0
}
```

## 4. Future Events

Add after MVP as needed:

```txt
notification_permission_prompt_shown
notification_permission_granted
notification_permission_denied
notification_opened
streak_lost
missed_city_viewed
missed_city_unlocked
paid_pack_viewed
paid_pack_purchased
ad_offer_viewed
ad_completed
```

## 5. Key Funnels

### Quiz Funnel

```txt
today_challenge_viewed
↓
quiz_started
↓
question_answered
↓
quiz_completed
↓
city_stamp_collected / perfect_stamp_collected
```

### Guest Save Funnel

```txt
save_progress_prompt_shown
↓
signup_started
↓
signup_completed
↓
guest_progress_merged
```

### Passport Engagement Funnel

```txt
quiz_completed
↓
passport_opened
↓
stamp_detail_opened
```

## 6. Retention Metrics

Important early metrics:

- Day 1 retention.
- Day 3 retention.
- Day 7 retention.
- Quiz start rate.
- Quiz completion rate.
- Passport open rate after quiz completion.
- Perfect Stamp rate.
- Guest-to-account conversion rate.

## 7. Analytics Implementation Notes

Create a thin analytics wrapper:

```ts
track('quiz_started', {
  city_slug,
  season_slug,
  challenge_date,
  total_questions,
});
```

Benefits:

- Centralized event names.
- Easier testing.
- Easier future replacement.
- Prevents Firebase-specific code across screens.

## 8. Privacy Notes

Do not track:

- Email addresses.
- Full names.
- Precise location.
- Full question text.
- Anything sensitive or unnecessary.

Timezone and local date are acceptable for product functionality and debugging, but avoid overusing location-like data.
