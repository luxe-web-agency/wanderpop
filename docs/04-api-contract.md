# WanderPop API Contract

This document defines the intended contract between the mobile app and the backend.

The exact implementation can use Supabase Edge Functions, Postgres RPC functions, or a small API layer. The important part is that game-sensitive operations are backend-controlled.

## 1. API Principles

- Mobile app displays and submits.
- Backend validates and decides.
- Client should not directly award stamps.
- Client should not directly update streaks.
- Client should not directly mark quiz attempts complete.
- Client should not send `is_correct`; backend calculates it.
- Client should not be trusted for score.

## 2. Shared Request Context

Most calls should include or derive:

```json
{
  "local_date": "2026-05-28",
  "timezone": "Asia/Seoul"
}
```

Notes:

- `local_date` is the user’s current local calendar date.
- `timezone` is useful for debugging and future edge cases.
- Backend should store relevant local date values on attempts/stamps.

## 3. `getTodayChallenge`

### Purpose

Returns today’s city and user-specific quiz status.

### Request

```json
{
  "local_date": "2026-05-28",
  "timezone": "Asia/Seoul"
}
```

### Response

```json
{
  "challenge": {
    "id": "challenge_uuid",
    "date": "2026-05-28",
    "season": {
      "id": "season_uuid",
      "slug": "season-1",
      "name": "Season 1"
    },
    "city": {
      "id": "city_uuid",
      "slug": "seoul",
      "name": "Seoul",
      "country": "South Korea",
      "short_description": "A high-energy capital where palaces, street food, and neon neighborhoods collide.",
      "stamp_image_url": null,
      "stamp_silhouette_url": null
    }
  },
  "user_status": {
    "quiz_status": "not_started",
    "attempt_id": null,
    "answered_count": 0,
    "total_questions": 7,
    "stamp_type": null,
    "score": null
  }
}
```

### Possible `quiz_status` Values

```txt
not_started
in_progress
completed
missed
unavailable
```

### Notes

- If today’s challenge is not published, return a safe unavailable state.
- Do not expose unpublished future challenge answers.

## 4. `startQuiz`

### Purpose

Creates or resumes a quiz attempt for today’s challenge.

### Request

```json
{
  "daily_challenge_id": "challenge_uuid",
  "local_date": "2026-05-28",
  "timezone": "Asia/Seoul"
}
```

### Response

```json
{
  "attempt": {
    "id": "attempt_uuid",
    "status": "in_progress",
    "started_at": "2026-05-28T12:00:00Z",
    "answered_count": 0,
    "total_questions": 7
  },
  "questions": [
    {
      "id": "question_uuid",
      "order": 1,
      "difficulty": "easy",
      "question_text": "Which Seoul palace is famous for its changing of the guard ceremony?",
      "options": [
        {
          "id": "option_uuid_1",
          "order": 1,
          "text": "Gyeongbokgung Palace"
        },
        {
          "id": "option_uuid_2",
          "order": 2,
          "text": "Buckingham Palace"
        }
      ],
      "answered": false,
      "selected_option_id": null
    }
  ]
}
```

### Rules

- If no attempt exists, create one.
- If an in-progress attempt exists, return it.
- If a completed attempt exists, return completed status and do not create a new attempt.
- Questions should be returned in fixed order.

## 5. `submitAnswer`

### Purpose

Locks a user’s answer and returns feedback.

### Request

```json
{
  "attempt_id": "attempt_uuid",
  "question_id": "question_uuid",
  "selected_option_id": "option_uuid",
  "local_date": "2026-05-28",
  "timezone": "Asia/Seoul"
}
```

### Response

```json
{
  "answer": {
    "question_id": "question_uuid",
    "selected_option_id": "option_uuid",
    "is_correct": true,
    "correct_option_id": "correct_option_uuid",
    "answered_at": "2026-05-28T12:02:00Z"
  },
  "feedback": {
    "result": "correct",
    "fun_fact": "Gyeongbokgung was the main royal palace of the Joseon dynasty."
  },
  "attempt": {
    "id": "attempt_uuid",
    "status": "in_progress",
    "answered_count": 1,
    "total_questions": 7
  }
}
```

### Rules

Backend must validate:

- Attempt belongs to current user.
- Attempt is not completed.
- Question belongs to the attempt’s challenge.
- Selected option belongs to the question.
- Question has not already been answered.
- Correctness is calculated server-side.

If duplicate answer:

```json
{
  "error": {
    "code": "ANSWER_ALREADY_SUBMITTED",
    "message": "This question has already been answered."
  }
}
```

## 6. `completeQuiz`

### Purpose

Completes the quiz, calculates score, awards stamp, and updates streak.

### Request

```json
{
  "attempt_id": "attempt_uuid",
  "local_date": "2026-05-28",
  "timezone": "Asia/Seoul"
}
```

### Response

```json
{
  "attempt": {
    "id": "attempt_uuid",
    "status": "completed",
    "score": 7,
    "total_questions": 7,
    "completed_at": "2026-05-28T12:10:00Z"
  },
  "stamp": {
    "id": "stamp_uuid",
    "type": "perfect",
    "city_name": "Seoul",
    "collected_at": "2026-05-28T12:10:00Z"
  },
  "streak": {
    "current_streak": 3,
    "longest_streak": 5,
    "was_incremented": true
  }
}
```

### Rules

- Can only complete if all required questions have answers.
- Score must be calculated by backend from stored answers.
- City Stamp awarded on completion.
- Perfect Stamp awarded if score equals total questions.
- Streak increments only if completed on the correct local date.
- Completed quiz cannot be completed again.
- If stamp already exists, return existing stamp.

## 7. `getPassport`

### Purpose

Returns the user’s season passport state.

### Request

```json
{
  "season_id": "season_uuid",
  "local_date": "2026-05-28",
  "timezone": "Asia/Seoul"
}
```

### Response

```json
{
  "season": {
    "id": "season_uuid",
    "slug": "season-1",
    "name": "Season 1"
  },
  "streak": {
    "current_streak": 3,
    "longest_streak": 5
  },
  "slots": [
    {
      "daily_challenge_id": "challenge_uuid",
      "date": "2026-05-26",
      "city": {
        "id": "city_uuid",
        "slug": "kyoto",
        "name": "Kyoto",
        "country": "Japan"
      },
      "status": "perfect",
      "score": 7,
      "total_questions": 7,
      "stamp_type": "perfect",
      "collected_at": "2026-05-26T12:00:00Z"
    },
    {
      "daily_challenge_id": "challenge_uuid_2",
      "date": "2026-05-27",
      "city": {
        "id": "city_uuid_2",
        "slug": "bangkok",
        "name": "Bangkok",
        "country": "Thailand"
      },
      "status": "missed",
      "score": null,
      "total_questions": 7,
      "stamp_type": null,
      "collected_at": null
    }
  ]
}
```

### Slot Status Values

```txt
upcoming
available_today
collected
perfect
missed
```

## 8. `getStampDetail`

### Purpose

Returns details for one passport slot.

### Request

```json
{
  "daily_challenge_id": "challenge_uuid",
  "local_date": "2026-05-28",
  "timezone": "Asia/Seoul"
}
```

### Response

```json
{
  "city": {
    "name": "Seoul",
    "country": "South Korea",
    "short_description": "A high-energy capital where palaces, street food, and neon neighborhoods collide."
  },
  "stamp": {
    "status": "perfect",
    "type": "perfect",
    "score": 7,
    "total_questions": 7,
    "collected_at": "2026-05-28T12:10:00Z"
  }
}
```

MVP detail should show stamp + score. Full quiz recap can come later.

## 9. `mergeGuestProgress`

### Purpose

Merges guest progress into a registered account after sign-in/account linking.

### Request

```json
{
  "guest_user_id": "guest_uuid",
  "registered_user_id": "registered_uuid"
}
```

### Response

```json
{
  "merged": true,
  "summary": {
    "stamps_merged": 4,
    "attempts_merged": 1,
    "conflicts_resolved": 0
  }
}
```

### Rules

- Keep best progress if both accounts have the same challenge.
- Perfect Stamp outranks City Stamp.
- Completed attempt outranks in-progress attempt.
- Do not duplicate stamps.
- Preserve longest streak conservatively.

## 10. Error Format

Use a consistent error shape.

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message."
  }
}
```

Suggested codes:

```txt
CHALLENGE_NOT_FOUND
CHALLENGE_NOT_AVAILABLE
QUIZ_ALREADY_COMPLETED
ANSWER_ALREADY_SUBMITTED
QUESTION_NOT_IN_ATTEMPT
OPTION_NOT_IN_QUESTION
NOT_ALL_QUESTIONS_ANSWERED
UNAUTHORIZED
NETWORK_ERROR
UNKNOWN_ERROR
```

## 11. Client Service Layer

Recommended app services:

```txt
services/challenges.ts
  getTodayChallenge()

services/quiz.ts
  startQuiz()
  submitAnswer()
  completeQuiz()

services/passport.ts
  getPassport()
  getStampDetail()

services/auth.ts
  ensureGuestSession()
  startEmailMagicLink()
  mergeGuestProgress()

services/analytics.ts
  track()
```

Do not call Supabase directly from screens except through feature hooks/services.

## 12. Implementation Note

For early MVP, the backend contract can begin as simple Supabase calls plus carefully written functions. However, preserve this boundary in the app code so the backend implementation can change later without rewriting screens.
