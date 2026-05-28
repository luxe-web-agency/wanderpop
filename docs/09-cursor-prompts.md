# Cursor Prompts for WanderPop

Use these prompts to guide Cursor through the MVP build.

Do not ask Cursor to build the whole app at once. Use one phase or feature per thread.

## General Working Prompt

```txt
You are helping build WanderPop.

Before coding:
1. Read the relevant docs in `/docs`.
2. Summarize your understanding.
3. Propose a short implementation plan.
4. List files you will create or modify.
5. State assumptions and risks.
6. Wait for approval before editing files.

Use TypeScript.
Keep code simple, readable, and maintainable.
Do not add unnecessary dependencies.
Do not implement features outside the requested scope.
```

## Phase 1 Prompt: App Foundation

```txt
You are the technical lead for WanderPop.

First read:
- README.md
- docs/01-product-spec.md
- docs/02-technical-spec.md
- docs/05-build-plan.md
- .cursor/rules/wanderpop-project.mdc

Create only Phase 1 of the MVP foundation.

Scope:
- Set up the monorepo structure.
- Create `apps/mobile` as an Expo React Native app.
- Use TypeScript.
- Create placeholder screens:
  - Welcome
  - Home
  - Quiz
  - QuizComplete
  - Passport
  - StampDetail
  - Account
- Add basic navigation.
- Add a clean folder structure.
- Add simple reusable UI primitives if helpful.

Do not implement:
- Supabase
- auth
- Firebase
- real quiz logic
- content import
- backend calls

Before editing files, provide:
1. Summary of your understanding.
2. Proposed folder structure.
3. Files you will create or modify.
4. Assumptions.
```

## Phase 2 Prompt: Shared Types

```txt
Read:
- docs/01-product-spec.md
- docs/02-technical-spec.md
- docs/03-data-model.md
- docs/04-api-contract.md

Create the initial `packages/shared` package.

Scope:
- Add shared TypeScript types for:
  - Difficulty
  - QuizAttemptStatus
  - StampType
  - PassportSlotStatus
  - API request/response DTOs
  - Analytics event names
- Export types cleanly from a package index.
- Update the mobile app to import at least one shared type to verify the package works.

Do not add business logic beyond simple constants/types.
Before editing, list files to create/modify.
```

## Phase 3 Prompt: Supabase Schema

```txt
Read:
- docs/03-data-model.md
- docs/04-api-contract.md

Create the initial Supabase migration for WanderPop.

Scope:
- Add tables:
  - profiles
  - seasons
  - cities
  - daily_challenges
  - questions
  - question_options
  - quiz_attempts
  - quiz_answers
  - user_stamps
  - user_streaks
- Add constraints and indexes that protect core rules.
- Add basic updated_at handling if appropriate.
- Add initial RLS policies or TODO comments if you need to keep policies minimal for local development.

Do not implement Edge Functions yet.
Before editing, show the proposed schema summary and files to change.
```

## Phase 4 Prompt: CSV Import

```txt
Read:
- docs/06-content-model.md
- docs/03-data-model.md

Create the CSV content import workflow.

Scope:
- Add starter CSV files in `/content`.
- Add an import script in `/scripts/import-content.ts`.
- Validate required columns.
- Validate references across CSV files.
- Validate each question has exactly one correct option.
- Validate challenge dates.
- Upsert data into Supabase.
- Add clear error messages for invalid CSV rows.

Use simple readable code.
Do not build an admin dashboard.
Before editing, show the proposed import flow.
```

## Phase 5 Prompt: Supabase Client and Services

```txt
Read:
- docs/02-technical-spec.md
- docs/04-api-contract.md

Set up the mobile app service layer.

Scope:
- Add Supabase client setup.
- Add environment variable pattern.
- Create service files:
  - services/auth.ts
  - services/challenges.ts
  - services/quiz.ts
  - services/passport.ts
- Add placeholder implementations or typed stubs matching the API contract.
- Do not call Supabase directly from screens.
- Keep screens using hooks/services.

Do not implement complete backend logic yet.
Before editing, list files and config changes.
```

## Phase 6 Prompt: Guest Session

```txt
Read:
- docs/01-product-spec.md
- docs/02-technical-spec.md
- docs/04-api-contract.md

Implement the silent guest session foundation.

Scope:
- On app start, create or restore guest identity/session.
- Ensure a profile row exists.
- Allow the user into the app without manual signup.
- Add loading/error states.
- Do not force sign-up before playing.

Out of scope:
- Google sign-in
- Apple sign-in
- Complex account merge UI

Before editing, explain how guest identity will be stored and restored.
```

## Phase 7 Prompt: Today’s Challenge

```txt
Read:
- docs/01-product-spec.md
- docs/02-technical-spec.md
- docs/04-api-contract.md

Implement the Today’s Challenge flow.

Scope:
- Get user's local date and timezone.
- Fetch today’s challenge from Supabase/backend.
- Show city name, country, short description.
- Show Start/Continue/Completed state.
- Handle unavailable challenge gracefully.

Do not implement the full quiz screen yet.
Before editing, list files and API/service methods to change.
```

## Phase 8 Prompt: Quiz Flow

```txt
Read:
- docs/01-product-spec.md
- docs/04-api-contract.md

Implement the quiz flow.

Scope:
- Start or resume quiz.
- Show fixed-order questions.
- Show multiple-choice options.
- Submit answers one at a time.
- Lock answers after submission.
- Show correct/incorrect feedback.
- Show fun fact after each answer.
- Continue to next question.
- Route to completion screen after final question.

Do not allow retries.
Do not calculate final stamp client-side.
Before editing, describe how answer locking will be enforced.
```

## Phase 9 Prompt: Completion, Stamps, Streaks

```txt
Read:
- docs/01-product-spec.md
- docs/03-data-model.md
- docs/04-api-contract.md

Implement quiz completion.

Scope:
- Complete quiz through backend function/service.
- Calculate score server-side.
- Award City Stamp for completion.
- Award Perfect Stamp for 100%.
- Update streak only if completed on correct local date.
- Show score and stamp on QuizComplete screen.
- Prevent replay after completion.

Before editing, explain what logic is backend-owned vs client-owned.
```

## Phase 10 Prompt: Passport

```txt
Read:
- docs/01-product-spec.md
- docs/03-data-model.md
- docs/04-api-contract.md

Implement the Passport MVP.

Scope:
- Fetch passport for current season.
- Show season-based grid.
- Show collected stamps.
- Show Perfect Stamp state.
- Show missed cities as grey silhouettes.
- Show upcoming/locked cities.
- Add StampDetail screen showing stamp + score.

Do not implement missed-city unlocking yet.
Before editing, explain passport slot statuses.
```

## Phase 11 Prompt: Analytics

```txt
Read:
- docs/07-analytics-plan.md

Implement Firebase Analytics wrapper and MVP events.

Scope:
- Add analytics service wrapper.
- Track:
  - app_opened
  - guest_created
  - today_challenge_viewed
  - quiz_started
  - quiz_resumed
  - question_answered
  - quiz_completed
  - city_stamp_collected
  - perfect_stamp_collected
  - passport_opened
  - save_progress_prompt_shown
  - signup_started
  - signup_completed
- Do not track sensitive data.
- Do not put full question text in analytics.

Before editing, list where each event will be fired.
```

## Debugging Prompt

```txt
We have a bug in WanderPop.

Before changing code:
1. Read the relevant docs.
2. Explain the expected product behavior.
3. Identify likely files involved.
4. Propose 2–3 possible causes.
5. Suggest the smallest safe fix.
6. Wait for approval before editing.
```

## Refactor Prompt

```txt
Refactor this part of WanderPop for clarity.

Rules:
- Do not change product behavior.
- Do not add new dependencies.
- Keep files small and readable.
- Preserve TypeScript types.
- Update imports as needed.
- After refactor, explain what changed and why.
```

## Code Review Prompt

```txt
Review the current diff against:
- docs/01-product-spec.md
- docs/02-technical-spec.md
- docs/04-api-contract.md
- .cursor/rules/wanderpop-project.mdc

Look for:
- Product rule violations.
- Backend/client responsibility violations.
- Unnecessary dependencies.
- Overly complex abstractions.
- TypeScript issues.
- Missing loading/error states.
- Analytics mistakes.
- Security risks around scoring, stamps, and streaks.

Do not edit files. Provide review comments only.
```
