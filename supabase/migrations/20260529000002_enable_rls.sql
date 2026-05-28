alter table public.profiles enable row level security;
alter table public.seasons enable row level security;
alter table public.cities enable row level security;
alter table public.daily_challenges enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_answers enable row level security;
alter table public.user_stamps enable row level security;
alter table public.user_streaks enable row level security;

revoke all on all tables in schema public from anon, authenticated;

grant usage on schema public to anon, authenticated;

grant select on public.seasons to anon, authenticated;
grant select on public.cities to anon, authenticated;
grant select on public.daily_challenges to anon, authenticated;
grant select on public.questions to anon, authenticated;
grant select (
  id,
  question_id,
  option_order,
  option_text,
  created_at,
  updated_at
) on public.question_options to anon, authenticated;

grant select on public.profiles to authenticated;
grant update (
  display_name,
  last_seen_at,
  preferred_language
) on public.profiles to authenticated;

grant select on public.quiz_attempts to authenticated;
grant select on public.quiz_answers to authenticated;
grant select on public.user_stamps to authenticated;
grant select on public.user_streaks to authenticated;

grant all on all tables in schema public to service_role;

create policy "Published active seasons are readable"
  on public.seasons
  for select
  to anon, authenticated
  using (is_active = true);

create policy "Published cities are readable"
  on public.cities
  for select
  to anon, authenticated
  using (is_published = true);

create policy "Published daily challenges are readable"
  on public.daily_challenges
  for select
  to anon, authenticated
  using (is_published = true);

create policy "Published questions are readable"
  on public.questions
  for select
  to anon, authenticated
  using (
    is_published = true
    and exists (
      select 1
      from public.daily_challenges
      where daily_challenges.id = questions.daily_challenge_id
        and daily_challenges.is_published = true
    )
  );

create policy "Published question options are readable without correctness"
  on public.question_options
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.questions
      join public.daily_challenges
        on daily_challenges.id = questions.daily_challenge_id
      where questions.id = question_options.question_id
        and questions.is_published = true
        and daily_challenges.is_published = true
    )
  );

create policy "Users can read own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Users can read own quiz attempts"
  on public.quiz_attempts
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read own quiz answers"
  on public.quiz_answers
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.quiz_attempts
      where quiz_attempts.id = quiz_answers.quiz_attempt_id
        and quiz_attempts.user_id = (select auth.uid())
    )
  );

create policy "Users can read own stamps"
  on public.user_stamps
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read own streaks"
  on public.user_streaks
  for select
  to authenticated
  using ((select auth.uid()) = user_id);
