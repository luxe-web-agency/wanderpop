create extension if not exists pgcrypto with schema extensions;

create type public.account_type as enum ('guest', 'registered');
create type public.difficulty as enum ('easy', 'medium', 'hard');
create type public.quiz_attempt_status as enum ('in_progress', 'completed', 'abandoned');
create type public.stamp_type as enum ('city', 'perfect');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  account_type public.account_type not null default 'guest',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz,
  preferred_language text not null default 'en'
);

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  starts_on date not null,
  ends_on date,
  sort_order integer not null default 0,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seasons_slug_not_empty check (length(trim(slug)) > 0),
  constraint seasons_name_not_empty check (length(trim(name)) > 0),
  constraint seasons_date_range check (ends_on is null or ends_on >= starts_on)
);

create table public.cities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  country text not null,
  region text,
  timezone_hint text,
  short_description text,
  stamp_image_url text,
  stamp_silhouette_url text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cities_slug_not_empty check (length(trim(slug)) > 0),
  constraint cities_name_not_empty check (length(trim(name)) > 0),
  constraint cities_country_not_empty check (length(trim(country)) > 0)
);

create table public.daily_challenges (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete restrict,
  city_id uuid not null references public.cities(id) on delete restrict,
  challenge_date date not null,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (challenge_date),
  unique (season_id, sort_order),
  unique (id, city_id)
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  daily_challenge_id uuid not null,
  city_id uuid not null,
  question_order integer not null,
  difficulty public.difficulty not null,
  question_text text not null,
  fun_fact text not null,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (daily_challenge_id, question_order),
  unique (id, daily_challenge_id),
  foreign key (daily_challenge_id, city_id)
    references public.daily_challenges(id, city_id)
    on delete cascade,
  constraint questions_order_positive check (question_order > 0),
  constraint questions_text_not_empty check (length(trim(question_text)) > 0),
  constraint questions_fun_fact_not_empty check (length(trim(fun_fact)) > 0)
);

create table public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  option_order integer not null,
  option_text text not null,
  is_correct boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (question_id, option_order),
  unique (id, question_id),
  constraint question_options_order_positive check (option_order > 0),
  constraint question_options_text_not_empty check (length(trim(option_text)) > 0)
);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  daily_challenge_id uuid not null references public.daily_challenges(id) on delete restrict,
  local_date date not null,
  timezone text,
  status public.quiz_attempt_status not null default 'in_progress',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  score integer,
  total_questions integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, daily_challenge_id),
  unique (id, daily_challenge_id),
  constraint quiz_attempts_score_nonnegative check (score is null or score >= 0),
  constraint quiz_attempts_total_questions_positive check (total_questions is null or total_questions > 0),
  constraint quiz_attempts_score_within_total check (
    score is null
    or total_questions is null
    or score <= total_questions
  ),
  constraint quiz_attempts_completed_has_result check (
    status <> 'completed'
    or (completed_at is not null and score is not null and total_questions is not null)
  )
);

create table public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  quiz_attempt_id uuid not null,
  question_id uuid not null,
  selected_option_id uuid not null,
  is_correct boolean not null,
  answered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (quiz_attempt_id, question_id),
  foreign key (quiz_attempt_id)
    references public.quiz_attempts(id)
    on delete cascade,
  foreign key (question_id)
    references public.questions(id)
    on delete restrict,
  foreign key (selected_option_id, question_id)
    references public.question_options(id, question_id)
    on delete restrict
);

create table public.user_stamps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  season_id uuid not null references public.seasons(id) on delete restrict,
  city_id uuid not null references public.cities(id) on delete restrict,
  daily_challenge_id uuid not null references public.daily_challenges(id) on delete restrict,
  quiz_attempt_id uuid not null,
  stamp_type public.stamp_type not null,
  collected_at timestamptz not null default now(),
  local_date date not null,
  score integer not null,
  total_questions integer not null,
  created_at timestamptz not null default now(),
  unique (user_id, daily_challenge_id),
  foreign key (quiz_attempt_id, daily_challenge_id)
    references public.quiz_attempts(id, daily_challenge_id)
    on delete restrict,
  constraint user_stamps_score_nonnegative check (score >= 0),
  constraint user_stamps_total_questions_positive check (total_questions > 0),
  constraint user_stamps_score_within_total check (score <= total_questions),
  constraint user_stamps_type_matches_score check (
    (stamp_type = 'perfect' and score = total_questions)
    or (stamp_type = 'city' and score < total_questions)
  )
);

create table public.user_streaks (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_completed_local_date date,
  updated_at timestamptz not null default now(),
  constraint user_streaks_current_nonnegative check (current_streak >= 0),
  constraint user_streaks_longest_nonnegative check (longest_streak >= 0),
  constraint user_streaks_longest_at_least_current check (longest_streak >= current_streak)
);

create unique index question_options_one_correct_per_question
  on public.question_options(question_id)
  where is_correct;

create index daily_challenges_challenge_date_idx
  on public.daily_challenges(challenge_date);

create index daily_challenges_season_id_sort_order_idx
  on public.daily_challenges(season_id, sort_order);

create index questions_daily_challenge_id_question_order_idx
  on public.questions(daily_challenge_id, question_order);

create index question_options_question_id_option_order_idx
  on public.question_options(question_id, option_order);

create index quiz_attempts_user_id_daily_challenge_id_idx
  on public.quiz_attempts(user_id, daily_challenge_id);

create index quiz_answers_quiz_attempt_id_idx
  on public.quiz_answers(quiz_attempt_id);

create index user_stamps_user_id_season_id_idx
  on public.user_stamps(user_id, season_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger seasons_set_updated_at
  before update on public.seasons
  for each row execute function public.set_updated_at();

create trigger cities_set_updated_at
  before update on public.cities
  for each row execute function public.set_updated_at();

create trigger daily_challenges_set_updated_at
  before update on public.daily_challenges
  for each row execute function public.set_updated_at();

create trigger questions_set_updated_at
  before update on public.questions
  for each row execute function public.set_updated_at();

create trigger question_options_set_updated_at
  before update on public.question_options
  for each row execute function public.set_updated_at();

create trigger quiz_attempts_set_updated_at
  before update on public.quiz_attempts
  for each row execute function public.set_updated_at();

create trigger user_streaks_set_updated_at
  before update on public.user_streaks
  for each row execute function public.set_updated_at();
