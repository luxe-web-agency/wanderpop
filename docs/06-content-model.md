# WanderPop Content Model

WanderPop MVP content should be manually created and managed through CSV files.

The goal is to avoid building an admin dashboard too early while still keeping content editable without app updates.

## 1. Content Principles

- Founder-managed content for MVP.
- CSV-first workflow.
- Import into Supabase.
- Backend-controlled daily schedule.
- Text-only trivia for MVP.
- No editorial approval workflow required for MVP.
- Store enough metadata to support future expansion.
- Keep content structure simple.

## 2. MVP Content Files

Recommended files:

```txt
content/
  seasons.csv
  cities.csv
  daily_challenges.csv
  questions.csv
  question_options.csv
```

## 3. `seasons.csv`

Defines passport seasons.

### Columns

```csv
slug,name,description,starts_on,ends_on,sort_order,is_active
```

### Example

```csv
season-1,Season 1,The first WanderPop city collection,2026-07-01,,1,true
```

### Notes

- `slug` should be stable.
- `starts_on` and `ends_on` use `YYYY-MM-DD`.
- MVP can have one active season.

## 4. `cities.csv`

Defines cities.

### Columns

```csv
slug,name,country,region,timezone_hint,short_description,stamp_image_url,stamp_silhouette_url,is_published
```

### Example

```csv
seoul,Seoul,South Korea,Asia,Asia/Seoul,"A high-energy capital where palaces, street food, and neon neighborhoods collide.",,,true
```

### Notes

- `slug` should be lowercase and URL-safe.
- `timezone_hint` describes the city but does not control daily challenge reset.
- `short_description` appears on the Home screen or city detail.
- Stamp URLs can be blank during early MVP.

## 5. `daily_challenges.csv`

Defines which city appears on which local date.

### Columns

```csv
challenge_date,season_slug,city_slug,sort_order,is_published
```

### Example

```csv
2026-07-01,season-1,seoul,1,true
2026-07-02,season-1,kyoto,2,true
```

### Notes

- `challenge_date` is the user-local date.
- Everyone gets the same city for the same local date.
- Keep one city per date.
- The app should fetch this from backend, not hardcode it.

## 6. `questions.csv`

Defines quiz questions.

### Columns

```csv
city_slug,challenge_date,question_order,difficulty,question_text,fun_fact,is_published
```

### Example

```csv
seoul,2026-07-01,1,easy,"Which Seoul palace is famous for its changing of the guard ceremony?","Gyeongbokgung was the main royal palace of the Joseon dynasty.",true
```

### Notes

- `question_order` controls fixed order.
- MVP uses fixed order, not randomization.
- `difficulty` should be `easy`, `medium`, or `hard`.
- `fun_fact` is shown after answering.
- Question count should usually be 7 but remain flexible.

## 7. `question_options.csv`

Defines answer options.

### Columns

```csv
city_slug,challenge_date,question_order,option_order,option_text,is_correct
```

### Example

```csv
seoul,2026-07-01,1,1,"Gyeongbokgung Palace",true
seoul,2026-07-01,1,2,"Buckingham Palace",false
seoul,2026-07-01,1,3,"Forbidden City",false
seoul,2026-07-01,1,4,"Tokyo Imperial Palace",false
```

### Notes

- Each question must have exactly one correct answer.
- MVP should usually use 4 options.
- Do not hardcode the option count in the database.
- Option order should be controlled by CSV for MVP.

## 8. Import Script Requirements

The import script should validate:

### Seasons

- Required columns exist.
- Slug is unique.
- Date format is valid.
- Active season is valid.

### Cities

- Required columns exist.
- Slug is unique.
- Published cities have name and country.

### Daily Challenges

- Challenge date is valid.
- Season slug exists.
- City slug exists.
- No duplicate challenge date.
- No duplicate season sort order.
- Published challenge uses published city.

### Questions

- City exists.
- Challenge exists.
- Difficulty is valid.
- Question order is unique per challenge.
- Question text is not empty.
- Fun fact is not empty.
- Published challenge has at least one question.
- MVP target is 7 questions, but do not enforce exactly 7 globally.

### Options

- Question reference exists.
- Option order is unique per question.
- Option text is not empty.
- Exactly one correct answer per question.
- Recommended 4 options per question.

## 9. Starter MVP Content Target

Initial MVP content target:

```txt
5 cities / 5 days
7 questions per city by default
35 questions total
140 answer options if using 4 options each
```

This number can change before launch.

## 10. Content Quality Guidelines

Good WanderPop questions should be:

- Fun.
- Travel-oriented.
- Easy to understand.
- Short enough for mobile.
- Factually accurate.
- Not too academic.
- Not too obscure.
- A mix of culture, food, landmarks, neighborhoods, history, geography, and local quirks.

Avoid:

- Very long questions.
- Ambiguous answers.
- Multiple correct answers.
- Offensive stereotypes.
- Overly niche facts.
- Questions requiring detailed dates unless interesting.
- Trick questions that feel unfair.

## 11. Recommended Question Mix Per City

Default 7-question structure:

```txt
1 easy landmark/city identity question
1 easy food/culture question
1 medium neighborhood/location question
1 medium history/tradition question
1 medium local experience question
1 hard hidden detail question
1 hard but fun surprise question
```

## 12. Fun Fact Guidelines

Every question should have a short fun fact.

Good fun facts:

- Add charm.
- Teach something quickly.
- Make the city feel more vivid.
- Are 1–2 sentences.
- Avoid sounding like a textbook.

Example:

```txt
Gyeongbokgung was the main royal palace of the Joseon dynasty. Visitors can still watch a colorful guard-changing ceremony near the main gate.
```

## 13. Future Content Extensions

Do not build these for MVP, but keep them in mind:

- Image-based questions.
- Multilingual translations.
- Source/citation fields.
- Content approval workflow.
- Admin dashboard.
- City packs.
- Seasonal themes.
- Sponsored city content.
- User-facing city fact pages.
