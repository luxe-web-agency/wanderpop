# WanderPop Data Model

This document describes the recommended MVP data model.

The exact SQL can evolve during implementation, but the entity relationships and product rules should remain consistent.

## 1. Data Model Principles

- Backend is authoritative for scoring, stamps, streaks, and attempts.
- Content is managed in CSV and imported to Supabase.
- Daily challenges are backend-controlled.
- User progress is associated with a stable user ID from the beginning, including guest users.
- Missed cities should be representable without blocking later unlock/conversion.
- The model should support flexible question counts per city.

## 2. Core Entities

```txt
profiles
seasons
cities
daily_challenges
questions
question_options
quiz_attempts
quiz_answers
user_stamps
user_streaks
```

Optional later:

```txt
stamp_assets
unlock_transactions
purchase_products
city_packs
push_tokens
```

## 3. Suggested Enums

```txt
difficulty:
- easy
- medium
- hard

quiz_attempt_status:
- in_progress
- completed
- abandoned

stamp_type:
- city
- perfect

passport_slot_status:
- upcoming
- available_today
- collected
- perfect
- missed

auth_account_type:
- guest
- registered
```

## 4. `profiles`

Represents app-level user profile data.

Auth identity should be handled by Supabase Auth. This table stores app-specific user metadata.

Suggested columns:

```txt
id uuid primary key references auth.users(id)
display_name text nullable
account_type text not null default 'guest'
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
last_seen_at timestamptz nullable
preferred_language text not null default 'en'
```

Notes:

- `id` should match the Supabase Auth user ID.
- Guest users should still have profile rows.
- Account linking should preserve or merge progress.

## 5. `seasons`

Represents a collection period for daily city challenges.

Suggested columns:

```txt
id uuid primary key
slug text unique not null
name text not null
description text nullable
starts_on date not null
ends_on date nullable
sort_order integer not null default 0
is_active boolean not null default false
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Example:

```txt
slug: season-1
name: Season 1
starts_on: 2026-07-01
```

## 6. `cities`

Represents city content.

Suggested columns:

```txt
id uuid primary key
slug text unique not null
name text not null
country text not null
region text nullable
timezone_hint text nullable
short_description text nullable
stamp_image_url text nullable
stamp_silhouette_url text nullable
is_published boolean not null default false
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Notes:

- `timezone_hint` is descriptive and not used for daily reset.
- The daily challenge is based on user local date, not the city timezone.
- `stamp_image_url` may be null for early MVP placeholders.
- `stamp_silhouette_url` can support missed grey silhouettes.

## 7. `daily_challenges`

Maps a local calendar date to a city.

Suggested columns:

```txt
id uuid primary key
season_id uuid not null references seasons(id)
city_id uuid not null references cities(id)
challenge_date date not null
sort_order integer not null default 0
is_published boolean not null default false
created_at timestamptz not null default now()
updated_at timestamptz not null default now()

unique(challenge_date)
unique(season_id, sort_order)
```

Important:

- `challenge_date` represents the local date used by the user.
- Everyone sees the same city for the same local date.
- Users in different timezones may move to the next city at different real UTC times because reset is local midnight.

## 8. `questions`

Represents quiz questions for a city or daily challenge.

Recommended to associate questions directly with `daily_challenge_id` for MVP if each daily city has a unique quiz.

Suggested columns:

```txt
id uuid primary key
daily_challenge_id uuid not null references daily_challenges(id)
city_id uuid not null references cities(id)
question_order integer not null
difficulty text not null
question_text text not null
fun_fact text not null
is_published boolean not null default true
created_at timestamptz not null default now()
updated_at timestamptz not null default now()

unique(daily_challenge_id, question_order)
```

Notes:

- Keeping both `daily_challenge_id` and `city_id` makes queries convenient.
- If city questions are reused across seasons later, this model can be adjusted.

## 9. `question_options`

Represents multiple-choice options.

Suggested columns:

```txt
id uuid primary key
question_id uuid not null references questions(id)
option_order integer not null
option_text text not null
is_correct boolean not null default false
created_at timestamptz not null default now()
updated_at timestamptz not null default now()

unique(question_id, option_order)
```

Validation rule:

- Each question must have exactly one correct option.
- MVP should probably use 4 answer options per question.
- Do not hardcode exactly 4 options in the database.

## 10. `quiz_attempts`

Represents a user’s attempt at a daily challenge.

Suggested columns:

```txt
id uuid primary key
user_id uuid not null references profiles(id)
daily_challenge_id uuid not null references daily_challenges(id)
local_date date not null
timezone text nullable
status text not null default 'in_progress'
started_at timestamptz not null default now()
completed_at timestamptz nullable
score integer nullable
total_questions integer nullable
created_at timestamptz not null default now()
updated_at timestamptz not null default now()

unique(user_id, daily_challenge_id)
```

Rules:

- A user can only have one attempt per daily challenge.
- If in progress, app should resume it.
- If completed, app should not create another attempt.
- Score and total questions should be set on completion.

## 11. `quiz_answers`

Represents locked answers submitted during a quiz attempt.

Suggested columns:

```txt
id uuid primary key
quiz_attempt_id uuid not null references quiz_attempts(id)
question_id uuid not null references questions(id)
selected_option_id uuid not null references question_options(id)
is_correct boolean not null
answered_at timestamptz not null default now()
created_at timestamptz not null default now()

unique(quiz_attempt_id, question_id)
```

Rules:

- An answer cannot be changed after it is submitted.
- Backend should reject duplicate answers for the same attempt/question.
- Backend should calculate `is_correct`; client should not provide it.

## 12. `user_stamps`

Represents collected stamps.

Suggested columns:

```txt
id uuid primary key
user_id uuid not null references profiles(id)
season_id uuid not null references seasons(id)
city_id uuid not null references cities(id)
daily_challenge_id uuid not null references daily_challenges(id)
quiz_attempt_id uuid not null references quiz_attempts(id)
stamp_type text not null
collected_at timestamptz not null default now()
local_date date not null
score integer not null
total_questions integer not null
created_at timestamptz not null default now()

unique(user_id, daily_challenge_id)
```

Rules:

- `stamp_type` is `city` or `perfect`.
- Perfect Stamp means score equals total questions.
- City Stamp means completed but not perfect.
- A missed city does not necessarily need a `user_stamps` row.
- Missed status can be calculated from past challenges with no stamp.
- Later, missed-city unlock can create or convert a stamp row.

## 13. `user_streaks`

Stores current and longest streaks.

Suggested columns:

```txt
user_id uuid primary key references profiles(id)
current_streak integer not null default 0
longest_streak integer not null default 0
last_completed_local_date date nullable
updated_at timestamptz not null default now()
```

Rules:

- Only update on correct-day quiz completion.
- Completing a missed challenge later should not repair the original streak unless a future rule allows it.
- Backend should own updates.

## 14. Passport State Calculation

Passport should be returned as a backend response or derived from:

```txt
daily_challenges
+ user_stamps
+ quiz_attempts
+ current local date
```

Possible slot statuses:

```txt
upcoming:
  challenge date is after user's local date

available_today:
  challenge date equals user's local date and no stamp yet

collected:
  user has City Stamp

perfect:
  user has Perfect Stamp

missed:
  challenge date is before user's local date and user has no stamp
```

## 15. Guest Merge Strategy

When a guest account signs in or links to a real account, progress should merge.

Recommended conflict rule:

- If only guest has progress, keep guest progress.
- If only registered account has progress, keep registered progress.
- If both have progress for same challenge, keep the better result.
- Perfect Stamp outranks City Stamp.
- Completed outranks in-progress.
- More answered questions outranks fewer if both are in progress.
- Preserve longest streak conservatively.

This can be simplified during early MVP if signup happens before a user ever has another account.

## 16. Future-Ready Extensions

### Missed-City Unlocks

Future table:

```txt
unlock_transactions
- id
- user_id
- daily_challenge_id
- unlock_method
- unlocked_at
- source
```

Possible unlock methods:

```txt
paid
ad
currency
free_promo
admin
```

### Paid City Packs

Future tables:

```txt
city_packs
purchase_products
user_purchases
```

### Multilingual Content

Future approach:

```txt
city_translations
question_translations
question_option_translations
```

Do not build these for MVP unless needed.
