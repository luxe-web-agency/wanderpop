# WanderPop

WanderPop is a native-feeling iOS and Android travel trivia app where users complete a daily city quiz, earn collectible city stamps, and build a seasonal travel passport.

This repo is intended to be built as a lean MVP first, while preserving the technical foundations needed for future features like paid city packs, missed-city unlocks, account syncing, multilingual content, push notifications, and richer passport mechanics.

## MVP Summary

WanderPop’s MVP is a daily travel trivia experience:

1. A user opens the app.
2. A silent guest account is created automatically.
3. The user sees today’s city.
4. The user completes a fixed-order trivia quiz.
5. Each answer gives immediate feedback and a short fun fact.
6. Quiz completion earns a City Stamp.
7. A perfect score earns a Perfect Stamp.
8. The user is prompted to save/sync progress after meaningful moments.
9. The user can view collected and missed cities in a seasonal passport.

## Core Product Rules

- iOS and Android from day one.
- True native-feeling mobile app, not a webview shell.
- Phones only for MVP.
- English first; multilingual support later.
- Same daily city for everyone.
- Daily challenge is based on the user’s local calendar date.
- Quiz has 7 questions by default, but this should be flexible per city.
- Text-only questions for MVP.
- No retries.
- Answers are locked after submission.
- Users can resume an unfinished quiz.
- City Stamp is awarded on quiz completion.
- Perfect Stamp is awarded only for 100%.
- Daily score exists; there is no ongoing global user score.
- Streak counts only if the quiz is completed on the correct local day.
- Missed days reset current streak and preserve longest streak.
- Missed cities appear as grey silhouettes.
- Missed cities can be unlocked/converted later by a TBD method.
- Guest users can continue playing indefinitely.
- Guest progress must merge into the signed-in account later.
- Push notifications come shortly after MVP and should not block launch.

## Recommended Stack

- **Mobile:** Expo / React Native
- **Language:** TypeScript
- **Backend:** Supabase
- **Database:** Supabase Postgres
- **Auth:** Supabase Auth, starting with silent guest/anonymous flow
- **Analytics:** Firebase Analytics
- **Crash Reporting:** Firebase Crashlytics recommended
- **Content:** CSV-managed content imported into Supabase
- **Repo:** Monorepo

## Repo Structure

```txt
wanderpop/
  apps/
    mobile/                 # Expo app

  packages/
    shared/                 # Shared TypeScript types, constants, utilities

  supabase/
    migrations/             # Database migrations
    functions/              # Edge functions or backend functions if used
    seed.sql                # Optional seed data

  content/
    seasons.csv
    cities.csv
    daily_challenges.csv
    questions.csv
    question_options.csv

  scripts/
    import-content.ts       # CSV import script

  docs/
    01-product-spec.md
    02-technical-spec.md
    03-data-model.md
    04-api-contract.md
    05-build-plan.md
    06-content-model.md
    07-analytics-plan.md
    08-decisions.md
    09-cursor-prompts.md

  .cursor/
    rules/
      wanderpop-project.mdc
```

## MVP Development Principle

Keep the app delightful, the backend authoritative, and content editable without app updates.

The mobile app should be responsible for presentation, navigation, local state, and calling backend actions. The backend should be responsible for validating game rules, determining today’s challenge, locking answers, awarding stamps, and updating streaks.

## First Build Milestone

The first coding milestone should be the mobile app foundation only:

- Expo app setup
- TypeScript setup
- Navigation shell
- Placeholder screens
- Basic folder structure
- No real backend logic yet
- No real auth yet
- No real analytics yet

See `docs/05-build-plan.md` for the full phased build plan.
