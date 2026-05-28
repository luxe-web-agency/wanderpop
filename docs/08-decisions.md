# WanderPop Decision Log

This document records product and technical decisions that should guide implementation.

## Confirmed Decisions

### Platform

- Build for iOS and Android.
- Phones only for MVP.
- Avoid a web-app shell.
- App should feel native.

### Audience

- English-speaking users first.
- Multilingual support planned later.

### Account Flow

- Account system is needed.
- Users can play as guests first.
- Silent guest account should be created automatically.
- After completing a quiz, user is prompted to save/sync progress.
- Guests can continue playing indefinitely.
- Prompt after meaningful moments instead of blocking usage.
- Guest progress should merge into signed-in account.

### Auth Roadmap

- Email magic link.
- Google sign-in.
- Apple sign-in on iPhone.

### Daily City

- Same city for everyone each day.
- Daily city is based on user’s local date.
- Daily reset occurs at the user’s local midnight.
- Backend controls daily schedule from day one.

### Missed Days

- Missed day resets current streak.
- Longest streak is stored.
- Missed city appears as grey silhouette.
- Missed city is not collected.
- Missed city can be unlocked/converted later.
- Unlock method is TBD.

### Quiz

- 7 questions by default.
- Question count should remain flexible per city.
- No retries.
- Text-only for MVP.
- Fixed question order for MVP.
- Mixed difficulty.
- Answers lock after submission.
- User can leave mid-quiz and resume later.
- Immediate feedback after each answer.
- Fun fact after each answer.
- Recap at the end.

### Scoring

- Daily quiz score exists.
- No ongoing global user score.
- Score is number correct out of total questions.

### Stamps

- City Stamp awarded on completion.
- Perfect Stamp awarded for 100% score.
- Perfect Stamp visual treatment TBD.
- MVP should use a simple Perfect Stamp approach.

### Passport

- Organized by season.
- City detail MVP shows stamp + score.
- Missed cities shown as grey silhouettes.

### Content

- Founder manually creates MVP content.
- No editorial review workflow needed for MVP.
- MVP target is 5 cities/days.
- Content managed via CSV.
- Content imported into Supabase.
- Daily schedule controlled by backend.

### Analytics

- Firebase for analytics.
- Retention is the most important early signal.
- Analytics should be added from day one.

### Push Notifications

- Add shortly after MVP.
- Do not block MVP launch.

## Technical Decisions

### Repo Strategy

- Use monorepo.
- Keep app, backend, content, and shared types separated inside repo.

### Mobile

- Expo / React Native.
- TypeScript.
- Native-feeling app.
- Avoid unnecessary dependencies.

### Backend

- Supabase.
- Supabase Postgres.
- Supabase Auth.
- Backend authoritative for quiz/stamp/streak logic.

### Content Workflow

- CSV files in repo.
- Import script into Supabase.
- No admin dashboard for MVP.

## Open Decisions

### Perfect Stamp Visual

Options:

- Same stamp with small Perfect badge.
- Same stamp with ribbon.
- Same stamp with different border.
- Separate perfect artwork.

MVP should keep this simple.

### Missed-City Unlock Method

Options:

- Paid unlock.
- Ad unlock.
- In-app currency.
- Free unlock after time.
- Season pack unlock.

Not selected yet.

### Monetization

Future possibilities:

- Paid past seasons.
- Paid travel packs.
- Individual missed-city unlocks.
- Ads.
- Sponsored city of the day.
- Cosmetic stamp upgrades.

No MVP monetization confirmed.

### Push Notification Timing

Confirmed as shortly after MVP, but exact phase/date TBD.

### Stamp Asset Hosting

Options:

- Local placeholder assets.
- Remote storage/CDN assets.

Recommendation: local placeholders early, remote URLs before public launch if stamp art changes often.

## Decisions to Avoid Reopening Too Early

Do not revisit unless there is a strong reason:

- Native-feeling app instead of webview shell.
- Guest-first flow.
- Backend-controlled content.
- Backend-authoritative game logic.
- CSV content for MVP.
- Season-based passport.
- No admin dashboard for MVP.
