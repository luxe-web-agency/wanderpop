# AGENTS.md

Guidance for AI coding agents working on WanderPop.

## Project Summary

WanderPop is a native-feeling iOS and Android travel trivia app. Users complete a daily city quiz, receive immediate feedback and fun facts, collect City Stamps or Perfect Stamps, and view their seasonal passport.

## Required Reading

Before implementing features, read:

- `README.md`
- `docs/01-product-spec.md`
- `docs/02-technical-spec.md`
- Relevant docs for the requested feature
- `.cursor/rules/wanderpop-project.mdc`

## Product Rules

- Do not build a webview shell.
- Phones only for MVP.
- English-first.
- Same daily city for everyone.
- Daily city is based on user's local date.
- Daily reset is user's local midnight.
- No retries.
- Answers are locked after submission.
- User can resume unfinished quiz.
- City Stamp is awarded on completion.
- Perfect Stamp is awarded only for 100%.
- Missed cities appear as grey silhouettes.
- Missed cities can be unlocked/converted later, but not in MVP.
- Guest users can continue playing indefinitely.
- Guest progress must merge into signed-in account.

## Technical Rules

- Use TypeScript.
- Use Expo / React Native for mobile.
- Use Supabase for backend/database/auth.
- Use Firebase for analytics.
- Use CSV imports for MVP content.
- Keep backend authoritative for scoring, stamps, and streaks.
- Do not let the client directly award stamps or update streaks.
- Keep code simple, readable, and maintainable.
- Avoid unnecessary dependencies.
- Prefer small, feature-oriented files.

## Working Style

Before making large changes:

1. Summarize your understanding.
2. Propose a short plan.
3. List files to create/modify.
4. State assumptions.
5. Implement in small steps.
6. Run checks when available.

## Non-Goals for MVP

Do not implement unless explicitly requested:

- Admin dashboard.
- Paid packs.
- Ads.
- Push notifications.
- Leaderboards.
- Friends/social features.
- Complex stamp customization.
- Multilingual UI/content.
- Image questions.
- Web app.
