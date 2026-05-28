# WanderPop Product Spec

## 1. Product Overview

WanderPop is a daily travel trivia mobile app. Every day, users discover one city, answer trivia questions about it, and collect a city stamp in a seasonal passport.

The core loop is simple:

```txt
Open app → see today’s city → answer quiz → learn fun facts → collect stamp → view passport → return tomorrow
```

The app should feel cute, fun, colorful, and rewarding, while remaining technically lean for MVP.

## 2. Target Audience

### MVP Audience

- English-speaking users first.
- People who enjoy travel, trivia, geography, culture, and collecting things.
- Casual mobile users, not hardcore gamers.
- Users who may only play for a few minutes per day.

### Future Audience

- International users through multilingual support.
- Travelers who want destination inspiration.
- Casual collectors who may pay for past seasons or city packs.

## 3. MVP Platform Scope

- iOS and Android from day one.
- Phones only.
- No tablet-specific optimization for MVP.
- Native-feeling app experience.
- Do not build WanderPop as a webview shell.
- Avoid anything that feels like a basic website wrapped in an app.

## 4. MVP User Flow

### First-Time User Flow

```txt
Open app
↓
Silent guest account is created
↓
Welcome / intro screen
↓
Home screen shows today’s city
↓
User starts today’s quiz
↓
User answers each question
↓
User sees quick feedback + fun fact after each answer
↓
User completes quiz
↓
User earns City Stamp or Perfect Stamp
↓
User is prompted to save progress
↓
User can view passport
```

### Returning User Flow

```txt
Open app
↓
Home screen checks today’s challenge and user status
↓
If not started: show Start Quiz
If in progress: show Continue Quiz
If completed: show completed state
↓
User can view passport
```

## 5. Daily Challenge Rules

### Daily City

- Everyone receives the same daily city.
- The city shown is based on the user’s local calendar date.
- Daily reset happens at the user’s local midnight.
- The daily schedule is controlled by the backend from day one.
- The app should not require an app update to change upcoming cities.

### Missed Days

A missed day occurs when a user does not complete the daily quiz on the correct local calendar day.

When a user misses a day:

- Current streak resets.
- Longest streak remains stored.
- Missed city appears in the passport as a grey silhouette.
- The missed city is not collected.
- The missed city should be convertible to collected later.
- The unlock method is not selected for MVP.

Important: the MVP should not need to implement missed-city unlocking, but the data model should not make it difficult later.

## 6. Quiz Rules

### Question Count

- 7 questions by default.
- This is not a strict number.
- Some future cities may have more or fewer questions.

### Question Format

- Text-only for MVP.
- Multiple choice.
- Fixed question order for MVP.
- No image-based questions in MVP.
- Future formats may include images, maps, audio, ordering, true/false, and location-based clues.

### Answer Rules

- No retries.
- Once a user answers a question, that answer is locked.
- Users can leave mid-quiz and resume where they left off.
- Previously submitted answers must remain unchanged.
- The app should never allow a completed quiz to be replayed for a better stamp during MVP.

### Feedback Flow

After each answer:

```txt
User selects answer
↓
Answer is submitted and locked
↓
App shows correct/incorrect feedback
↓
App shows short fun fact
↓
User taps Next
```

At the end:

```txt
Quiz recap
↓
Final score
↓
Stamp earned
↓
Prompt to save progress
```

## 7. Difficulty Strategy

Each quiz should include a mix of difficulty levels.

Recommended default:

```txt
2 easy
3 medium
2 hard
```

This gives casual users early wins while making a perfect score feel earned.

The content model should support a `difficulty` field per question.

Suggested values:

```txt
easy
medium
hard
```

## 8. Scoring Rules

- The app tracks a daily quiz score.
- There is no cumulative user score in MVP.
- Score is based on the number of correct answers.
- Total possible score depends on the number of questions in that city’s quiz.

Example:

```txt
score: 6
total_questions: 7
```

## 9. Stamp Rules

### City Stamp

A City Stamp is earned when the user completes the quiz, regardless of score.

Requirements:

- User answered all required questions.
- Quiz was completed.
- Stamp is associated with the user, city, season, and challenge date.

### Perfect Stamp

A Perfect Stamp is earned only when the user scores 100%.

Requirements:

- User completed the quiz.
- User answered every question correctly.

### MVP Visual Treatment

The Perfect Stamp visual treatment is TBD. For MVP, keep it simple.

Acceptable MVP treatments:

- Same city stamp with a small “Perfect” label.
- Same city stamp with a simple badge.
- Same city stamp with a different border.
- Separate placeholder perfect state.

Do not overbuild the stamp visual system in MVP.

## 10. Passport Rules

The passport is the user’s collection view.

### Organization

- Organize by season.
- MVP can start with one season.
- A season contains a sequence of daily cities.

### Stamp States

Each city slot in the passport can appear as:

```txt
upcoming
available_today
collected_city_stamp
collected_perfect_stamp
missed_grey_silhouette
```

For MVP, the visual states can be simplified to:

```txt
collected
perfect
missed
locked/upcoming
```

### City Detail MVP

When a user taps a collected stamp, show:

- City name
- Stamp
- Score
- Total questions
- Date collected
- City Stamp or Perfect Stamp status

The MVP does not need a full quiz recap, although the data model can support it later.

## 11. Streak Rules

A user’s current streak only increments if the user completes the daily quiz on the correct local calendar day.

Rules:

- Complete today’s quiz on today’s local date: increment or start current streak.
- Miss a day: reset current streak.
- Longest streak should be preserved.
- Completing a missed city later should not automatically repair the original daily streak unless a future product rule explicitly allows it.

Important: Streak logic should be handled by the backend.

## 12. Guest and Account Rules

### Guest Play

- Users can play as guests.
- A guest account should be created silently.
- Users should not be forced to sign up before playing.
- Guests can continue playing indefinitely.

### Save Progress Prompt

Prompt users to create/save an account after meaningful moments, such as:

- After first stamp.
- After a Perfect Stamp.
- After a multi-day streak.
- When opening passport.
- Before changing devices or signing out.

### Account Methods

Auth roadmap:

- Email magic link.
- Google sign-in.
- Apple sign-in on iPhone.

### Guest Progress Merge

When a guest signs in:

- Guest progress must merge into the signed-in account.
- Existing collected stamps should not be lost.
- Existing streak data should be preserved or reconciled.
- Conflicts should be handled predictably.

MVP conflict rule recommendation:

If both guest and signed-in account have progress for the same daily challenge, keep the best result, where Perfect Stamp outranks City Stamp.

## 13. Analytics Goals

Retention is the most important early signal.

MVP analytics should answer:

- How many users open the app?
- How many start the quiz?
- How many complete the quiz?
- Where do users drop off?
- How many collect stamps?
- How many open the passport?
- How often are save-progress prompts shown?
- How many users begin and complete signup?

See `docs/07-analytics-plan.md`.

## 14. MVP Content Scope

Initial target:

- 5 cities / 5 days of content.
- Manually created by the founder.
- No editorial review workflow required for MVP.
- Text-only trivia.
- CSV-managed content.

This number may change before launch.

## 15. MVP Non-Goals

Do not build these for MVP unless intentionally re-scoped:

- Admin dashboard.
- Paid city packs.
- In-app purchases.
- Ads.
- Push notifications.
- Friends.
- Leaderboards.
- Social feed.
- Full multilingual system.
- Complex stamp customization.
- AI-generated live question pipeline.
- Image-based questions.
- Web version.
- Tablet-specific design.
