# WanderPop MVP Build Plan

This build plan is designed for a lean MVP developed with Cursor/AI assistance.

The goal is to build one small milestone at a time. Do not ask Cursor to build the entire app in one step.

## Build Strategy

Use this working rhythm:

```txt
1. One phase per Cursor thread.
2. One feature per implementation plan.
3. Ask Cursor to list files before editing.
4. Review diffs carefully.
5. Run type checks/lint checks after each phase.
6. Commit after each working milestone.
```

## Phase 0: Documentation and Repo Brain

### Goal

Create source-of-truth documentation so Cursor understands the product before implementation.

### Deliverables

- `README.md`
- `docs/01-product-spec.md`
- `docs/02-technical-spec.md`
- `docs/03-data-model.md`
- `docs/04-api-contract.md`
- `docs/05-build-plan.md`
- `docs/06-content-model.md`
- `docs/07-analytics-plan.md`
- `docs/08-decisions.md`
- `docs/09-cursor-prompts.md`
- `.cursor/rules/wanderpop-project.mdc`

### Done When

- Docs exist in repo.
- Cursor rules exist.
- Initial repo structure is agreed.

## Phase 1: Mobile App Foundation

### Goal

Create the Expo mobile app shell with placeholder screens and navigation.

### Scope

- Create monorepo structure.
- Create `apps/mobile`.
- Set up Expo with TypeScript.
- Add basic navigation.
- Add placeholder screens:
  - Welcome
  - Home
  - Quiz
  - QuizComplete
  - Passport
  - StampDetail
  - Account
- Add basic shared UI primitives.
- Add theme constants.

### Out of Scope

- Supabase integration.
- Real auth.
- Real quiz logic.
- Real analytics.
- Real content import.

### Done When

- App runs locally.
- All placeholder screens are reachable.
- Navigation works.
- TypeScript passes.
- No unnecessary dependencies added.

## Phase 2: Shared Types and Constants

### Goal

Create shared TypeScript types used by the app and future backend/API boundaries.

### Scope

In `packages/shared`, define:

- Difficulty types.
- Stamp types.
- Quiz status types.
- Passport slot status types.
- API request/response types.
- Analytics event name constants.
- Basic date helper types.

### Done When

- Mobile app imports types from shared package.
- No duplicated magic strings for core statuses.
- TypeScript passes.

## Phase 3: Supabase Project Setup

### Goal

Add the database foundation.

### Scope

- Create Supabase migration files.
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
- Add basic indexes and constraints.
- Add RLS placeholder policies or MVP policies.
- Add seed data if helpful.

### Done When

- Local Supabase can run migrations.
- Schema matches `docs/03-data-model.md`.
- Basic seed data can be inserted.
- Data constraints prevent obvious invalid states.

## Phase 4: CSV Content Model and Import Script

### Goal

Allow founder-managed content to be imported from CSV into Supabase.

### Scope

- Add content CSV files:
  - `seasons.csv`
  - `cities.csv`
  - `daily_challenges.csv`
  - `questions.csv`
  - `question_options.csv`
- Add `scripts/import-content.ts`.
- Validate required columns.
- Validate references.
- Validate one correct option per question.
- Validate question order.
- Insert/upsert content.

### Done When

- 5 MVP cities can be imported.
- Each city has its scheduled date.
- Each daily challenge has questions and answer options.
- Import script fails clearly on bad CSV data.

## Phase 5: Supabase Client and Environment Config

### Goal

Connect the Expo app to Supabase safely.

### Scope

- Add Supabase client setup.
- Add environment variable pattern.
- Add typed config.
- Add service layer stubs:
  - `challenges.ts`
  - `quiz.ts`
  - `passport.ts`
  - `auth.ts`

### Done When

- App can connect to Supabase.
- Environment variables are documented.
- Screens do not call Supabase directly.
- Services provide the abstraction layer.

## Phase 6: Guest Session Foundation

### Goal

Support silent guest play.

### Scope

- Create or restore guest user/session.
- Ensure profile exists.
- Store user state safely.
- Route user into app without signup friction.

### Out of Scope

- Full Google sign-in.
- Full Apple sign-in.
- Complex account merge UI.

### Done When

- New app install creates/uses a guest identity.
- Progress can be associated with that identity.
- User can play without manually signing up.

## Phase 7: Today’s Challenge

### Goal

Home screen displays today’s city based on user local date.

### Scope

- Implement `getTodayChallenge`.
- Send local date/timezone from app.
- Display city name and short intro.
- Display quiz status:
  - not started
  - in progress
  - completed
- Show Start/Continue/View Result button appropriately.

### Done When

- Home screen shows today’s city from Supabase.
- Local date is used.
- Completed state appears after completion.
- Missing/unavailable challenge has graceful fallback.

## Phase 8: Quiz Flow

### Goal

Implement the full quiz experience.

### Scope

- Start or resume quiz.
- Show fixed-order questions.
- Show multiple-choice options.
- Submit answer one question at a time.
- Lock submitted answers.
- Show correct/incorrect feedback.
- Show fun fact.
- Move to next question.
- Resume after app close.

### Done When

- User can complete a full quiz.
- Submitted answers cannot be changed.
- App resumes in-progress attempt.
- No retries after completion.
- Feedback flow works.

## Phase 9: Quiz Completion and Stamps

### Goal

Complete quiz and award City Stamp or Perfect Stamp.

### Scope

- Implement `completeQuiz`.
- Calculate score server-side.
- Award City Stamp for completion.
- Award Perfect Stamp for 100%.
- Update streak if completed on correct local date.
- Show QuizComplete screen.

### Done When

- Non-perfect score earns City Stamp.
- Perfect score earns Perfect Stamp.
- Score and total questions display.
- Streak updates correctly.
- Completed quiz cannot be replayed.

## Phase 10: Passport

### Goal

Show seasonal passport collection.

### Scope

- Implement `getPassport`.
- Show season grid.
- Show collected stamps.
- Show Perfect Stamps.
- Show missed grey silhouettes.
- Show upcoming/locked states.
- Add StampDetail screen with stamp + score.

### Done When

- Passport reflects user progress.
- Missed past cities appear as grey silhouettes.
- Tapping collected stamp shows detail.
- Tapping missed/upcoming slot behaves gracefully.

## Phase 11: Save Progress Prompt and Auth Roadmap

### Goal

Prompt guest users to save progress after meaningful moments.

### Scope

- Show prompt after first completed quiz.
- Add Account screen.
- Add email magic link flow if in MVP scope.
- Prepare account merge flow.
- Google and Apple can be added shortly after MVP if not included.

### Done When

- Guest users are prompted but not blocked.
- Registered users are not repeatedly prompted.
- Sign-in flow does not lose progress.
- Merge path is documented and started.

## Phase 12: Firebase Analytics

### Goal

Track core retention and funnel events.

### Scope

Add Firebase events:

- `app_opened`
- `guest_created`
- `quiz_started`
- `question_answered`
- `quiz_completed`
- `city_stamp_collected`
- `perfect_stamp_collected`
- `passport_opened`
- `save_progress_prompt_shown`
- `signup_started`
- `signup_completed`

### Done When

- Events fire once per intended action.
- Event names match `docs/07-analytics-plan.md`.
- No sensitive data is tracked.
- Analytics service wrapper exists.

## Phase 13: QA and MVP Polish

### Goal

Prepare for early testing.

### Scope

- Manual QA checklist.
- Error states.
- Loading states.
- Empty states.
- Basic accessibility labels.
- Basic device testing on iOS and Android.
- Basic crash/error handling.

### Done When

- Core loop works end-to-end.
- App handles network errors gracefully.
- App does not crash on missing content.
- First 5 cities work.
- MVP is ready for TestFlight / internal Android testing.

## Post-MVP Phase A: Push Notifications

### Goal

Add daily reminder notifications.

### Scope

- Ask permission at a thoughtful moment.
- Let user enable daily reminder.
- Send reminder around preferred time or default time.
- Track notification opt-in and opens.

### Not Blocking MVP

Push notifications should come shortly after MVP and should not delay initial build.

## Post-MVP Phase B: Missed-City Unlocks

### Goal

Allow missed cities to convert from grey silhouettes into collected stamps.

### Possible Unlock Methods

- Paid unlock.
- Ad unlock.
- In-app currency.
- Free promo.

### Not Yet Decided

Do not implement monetization until product strategy is chosen.

## Post-MVP Phase C: Paid Packs

### Goal

Sell travel packs or past season unlocks.

Potential products:

- Past season unlock.
- 30–60 city travel pack.
- Individual missed-city unlock.

Do not build during MVP unless intentionally re-scoped.

## Suggested Commit Milestones

```txt
commit 1: docs and cursor rules
commit 2: expo app shell
commit 3: shared types
commit 4: supabase schema
commit 5: csv import
commit 6: guest session
commit 7: today challenge
commit 8: quiz flow
commit 9: stamps and streaks
commit 10: passport
commit 11: analytics
commit 12: MVP polish
```
