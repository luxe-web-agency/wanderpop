# WanderPop Technical Spec

## 1. Technical Overview

WanderPop should be built as a native-feeling mobile app with a backend-controlled daily trivia system.

The technical strategy is:

```txt
Expo / React Native mobile app
+ Supabase backend/database/auth
+ Firebase Analytics
+ CSV content import
+ monorepo structure
```

The MVP should be simple, readable, and maintainable. Avoid unnecessary abstractions, large frameworks, and premature enterprise architecture.

## 2. Core Technical Principles

### 2.1 Backend Is Authoritative

The backend should decide:

- Which city is available today.
- Which questions belong to today’s quiz.
- Whether an answer is correct.
- Whether a quiz is complete.
- Whether a user earns a City Stamp.
- Whether a user earns a Perfect Stamp.
- Whether a streak increments or resets.
- Whether a city is missed.
- Whether a missed city can later be converted.

The app should not independently award stamps, calculate final rewards, or update streaks without backend validation.

### 2.2 App Is Presentation + Interaction

The mobile app should handle:

- Navigation.
- Screens.
- Animations.
- Local UI state.
- Calling backend actions.
- Rendering today’s city.
- Rendering quiz questions.
- Rendering feedback/fun facts.
- Rendering passport.
- Logging analytics events.

### 2.3 Content Editable Without App Updates

Cities, questions, answer options, daily schedules, and fun facts should be backend-controlled.

The app may include placeholder/local development data, but production content should come from Supabase.

### 2.4 Keep MVP Lean

Do not build future systems until needed.

Avoid for MVP:

- Admin dashboard.
- Complex content workflows.
- Payment systems.
- Ad systems.
- Push notifications.
- Highly abstracted game engine.
- Overly flexible question renderer.

Build the simplest version that supports the known MVP rules.

## 3. Recommended Monorepo Structure

```txt
wanderpop/
  apps/
    mobile/
      app/
        _layout.tsx
        index.tsx
        home.tsx
        quiz.tsx
        quiz-complete.tsx
        account.tsx
        passport/
          index.tsx
          [challengeId].tsx
      src/
        components/
        features/
        lib/
        providers/
        services/
        styles/

  packages/
    shared/
      src/
        constants/
        types/
        utils/

  supabase/
    migrations/
    functions/
    seed.sql

  content/
    seasons.csv
    cities.csv
    daily_challenges.csv
    questions.csv
    question_options.csv

  scripts/
    import-content.ts

  docs/
```

## 4. Mobile App Architecture

Current structure inside `apps/mobile`:

```txt
app/
  _layout.tsx
  index.tsx
  home.tsx
  quiz.tsx
  quiz-complete.tsx
  account.tsx
  passport/
    index.tsx
    [challengeId].tsx

src/
  components/
    Button.tsx
    Screen.tsx

  features/
    account/
      AccountScreen.tsx

    home/
      HomeScreen.tsx

    passport/
      PassportScreen.tsx
      StampDetailScreen.tsx

    quiz/
      QuizScreen.tsx
      QuizCompleteScreen.tsx

    welcome/
      WelcomeScreen.tsx

  lib/
    supabase.ts

  providers/
    AppProvider.tsx

  services/
    auth.ts
    challenges.ts
    quiz.ts
    passport.ts

  styles/
    theme.ts
```

Notes:

- Expo Router owns route files in `app/`.
- Route files should stay thin and delegate UI to `src/features/`.
- App-wide bootstrap and context live in `src/providers/`.
- Additional hooks, analytics wrappers, and shared components can be added later as the relevant phases are implemented.

## 5. Navigation

MVP screens:

```txt
Welcome
Home
Quiz
QuizComplete
Passport
StampDetail
Account
```

Recommended navigation behavior:

- First open may show Welcome.
- After welcome, route to Home.
- Home routes to Quiz or Continue Quiz.
- Quiz routes to QuizComplete when finished.
- QuizComplete routes to Passport or Home.
- Passport routes to StampDetail.
- Account handles save-progress/sign-in flows.

Implementation notes:

- Use Expo Router file-based routes rather than a custom `navigation/` directory.
- Keep the shared stack configuration in `app/_layout.tsx`.
- Prefer typed route helpers over broad casting when navigating between screens.
- The app should support deeper navigation later, but the current shell can remain a simple stack.

## 6. Backend Architecture

Recommended backend components:

```txt
Supabase Auth
Supabase Postgres
Supabase Row Level Security
Supabase Edge Functions or RPC functions for game actions
Supabase Storage later for stamp assets if needed
```

### 6.1 Reads

Some read-only data can be fetched directly from Supabase tables if RLS policies are safe.

Examples:

- Current season.
- Public city metadata.
- Public daily challenge metadata.
- Public question text for an active quiz.

### 6.2 Writes / Game Actions

Game-sensitive actions should go through controlled backend functions.

Examples:

- Start quiz.
- Submit answer.
- Complete quiz.
- Award stamp.
- Update streak.
- Merge guest progress.

This prevents the client from manipulating score/stamp/streak data.

## 7. Auth Strategy

### MVP Auth Flow

```txt
App opens
↓
Create or restore silent guest session
↓
User plays as guest
↓
After meaningful moment, prompt to save progress
↓
User signs in via email magic link, Google, or Apple later
↓
Guest progress merges into signed-in account
```

### Auth Requirements

- Guest play should be supported from the first usable version.
- Guest users should have stable IDs.
- Progress should be associated with a user ID from the start.
- Account linking/merge should be planned even if all providers are not implemented on day one.

### Provider Roadmap

MVP or shortly after:

- Email magic link.

Soon after:

- Google.
- Apple on iPhone.

## 8. Date and Timezone Strategy

The daily challenge is based on the user’s local calendar date.

The app should send the user’s local date to the backend when requesting today’s challenge.

Example:

```json
{
  "local_date": "2026-05-28",
  "timezone": "Asia/Seoul"
}
```

Backend should use the local date to resolve the active daily challenge.

Important:

- Store dates as dates, not just timestamps, where daily challenge identity matters.
- Store timestamps in UTC.
- Store the local date used for quiz completion.
- Streak logic should use the user’s submitted/derived local date and server-side validation rules.

## 9. Quiz Attempt Strategy

### Starting a Quiz

When the user taps start:

- Backend creates a `quiz_attempt` if none exists.
- If an in-progress attempt exists for the same challenge, backend returns it.
- If a completed attempt exists, backend returns completed status and does not create a new attempt.

### Submitting an Answer

When the user selects an answer:

- App calls backend.
- Backend checks whether the question belongs to the attempt.
- Backend checks whether the answer was already submitted.
- Backend stores the selected option.
- Backend determines correctness.
- Backend returns feedback and fun fact.

### Completing a Quiz

When all required questions are answered:

- Backend marks attempt completed.
- Backend calculates score.
- Backend awards City Stamp or Perfect Stamp.
- Backend updates streak if completed on correct local day.
- Backend returns final result.

## 10. Offline Behavior

MVP does not need full offline mode.

Recommended MVP behavior:

- App can cache the current in-progress quiz locally for smoother UX.
- Answer submission requires network.
- If offline, show a friendly error and allow retry.
- Do not award stamps offline.
- Do not finalize quiz offline.

## 11. Firebase Analytics

Firebase analytics is planned for a later MVP phase, after the guest flow and core quiz loop are stable enough to instrument cleanly.

Recommended also:

- Firebase Crashlytics for crash reporting.
- Keep analytics events thin and consistent.
- Do not track sensitive data.
- Avoid putting full question text in event names.

See `docs/07-analytics-plan.md`.

## 12. Content Import

Content should be managed through CSV files and imported into Supabase.

The import script should:

- Validate required columns.
- Validate references between files.
- Validate one correct answer per question.
- Validate daily challenge dates.
- Validate question order.
- Upsert data where appropriate.
- Fail clearly on invalid content.

See `docs/06-content-model.md`.

## 13. Stamp Assets

For MVP, use the simplest stamp asset workflow.

Recommended options:

### Option A: Local Placeholder Assets

Good for early dev.

- Fast.
- No storage/CDN work.
- Requires app update for new visual assets.

### Option B: Remote Asset URLs

Better for production.

- Stamp image URL stored on city or stamp record.
- App loads image remotely.
- New city assets do not require app update.

Recommendation:

- Use local placeholders during early development.
- Move to remote asset URLs before public launch if daily city assets are custom and expected to change.

## 14. Security and Data Integrity

The backend should prevent:

- Retrying completed quizzes.
- Changing submitted answers.
- Awarding fake stamps.
- Manipulating score.
- Updating someone else’s progress.
- Fetching unpublished future challenge answers if this matters for launch.

RLS policies should be added before production.

Minimum security posture:

- Public content can be read.
- User progress can only be read/written by the owning user.
- Game result writes happen through backend functions.
- Client cannot directly insert arbitrary stamp records.

## 15. TypeScript Strategy

Use TypeScript throughout.

Shared package should contain:

- Core enums.
- Shared DTO types.
- Analytics event names.
- Stamp status types.
- Difficulty types.
- API response types.

Do not over-share implementation details. Shared types should stabilize API boundaries and prevent duplicated strings.

## 16. Testing Strategy

MVP does not need exhaustive tests, but should have targeted tests for core rules.

Recommended:

- Unit tests for date helpers.
- Unit tests for stamp result calculation.
- Unit tests for streak calculation.
- Import script validation tests.
- Manual QA checklist for quiz flow.

Critical flows to test manually:

- New guest starts quiz.
- Guest answers one question and closes app.
- Guest resumes quiz.
- Guest completes quiz with non-perfect score.
- Guest completes quiz with perfect score.
- Completed quiz cannot be retried.
- Passport shows collected stamp.
- Missed city appears as grey silhouette.
- Save-progress prompt appears after completion.
- Guest progress merges into signed-in account.

## 17. Post-MVP Technical Roadmap

Shortly after MVP:

- Push notifications.
- Crashlytics if not added initially.
- Google and Apple sign-in.
- Missed-city unlock system.
- Remote stamp assets.
- Basic admin/content UI if CSV becomes painful.
- Paid packs/in-app purchases.
- Multilingual content model.
