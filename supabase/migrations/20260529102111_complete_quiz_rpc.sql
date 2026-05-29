create or replace function private.complete_quiz_result_payload(
  p_attempt_id uuid
)
returns jsonb
language sql
security definer
set search_path = public, private, extensions
as $$
  select jsonb_build_object(
    'attempt',
    jsonb_build_object(
      'id', qa.id,
      'status', 'completed',
      'score', qa.score,
      'total_questions', qa.total_questions,
      'completed_at', qa.completed_at
    ),
    'stamp',
    jsonb_build_object(
      'id', us.id,
      'type', us.stamp_type,
      'city_name', c.name,
      'collected_at', us.collected_at
    ),
    'streak',
    jsonb_build_object(
      'current_streak', ust.current_streak,
      'longest_streak', ust.longest_streak,
      'was_incremented', false
    )
  )
  from public.quiz_attempts qa
  join public.daily_challenges dc
    on dc.id = qa.daily_challenge_id
  join public.cities c
    on c.id = dc.city_id
  left join public.user_stamps us
    on us.user_id = qa.user_id
    and us.daily_challenge_id = qa.daily_challenge_id
  left join public.user_streaks ust
    on ust.user_id = qa.user_id
  where qa.id = p_attempt_id;
$$;

create or replace function private.complete_quiz_impl(
  attempt_id uuid,
  local_date date,
  timezone text
)
returns jsonb
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_attempt public.quiz_attempts%rowtype;
  v_challenge public.daily_challenges%rowtype;
  v_answered_count integer := 0;
  v_total_questions integer := 0;
  v_score integer := 0;
  v_stamp public.user_stamps%rowtype;
  v_stamp_type public.stamp_type;
  v_now timestamptz := now();
  v_streak public.user_streaks%rowtype;
  v_previous_current integer := 0;
  v_was_incremented boolean := false;
begin
  perform timezone;

  if v_user_id is null then
    raise exception 'UNAUTHORIZED';
  end if;

  select *
  into v_attempt
  from public.quiz_attempts qa
  where qa.id = complete_quiz_impl.attempt_id
    and qa.user_id = v_user_id;

  if not found then
    raise exception 'UNAUTHORIZED';
  end if;

  select *
  into v_challenge
  from public.daily_challenges dc
  where dc.id = v_attempt.daily_challenge_id;

  if not found then
    raise exception 'CHALLENGE_NOT_FOUND';
  end if;

  if v_attempt.status = 'completed' then
    return private.complete_quiz_result_payload(v_attempt.id);
  end if;

  select count(*)
  into v_total_questions
  from public.questions q
  where q.daily_challenge_id = v_attempt.daily_challenge_id
    and q.is_published = true;

  select count(*)
  into v_answered_count
  from public.quiz_answers qa
  join public.questions q
    on q.id = qa.question_id
  where qa.quiz_attempt_id = v_attempt.id
    and q.daily_challenge_id = v_attempt.daily_challenge_id
    and q.is_published = true;

  if v_answered_count <> v_total_questions then
    raise exception 'NOT_ALL_QUESTIONS_ANSWERED';
  end if;

  select count(*)
  into v_score
  from public.quiz_answers qa
  where qa.quiz_attempt_id = v_attempt.id
    and qa.is_correct = true;

  update public.quiz_attempts
  set
    status = 'completed',
    score = v_score,
    total_questions = v_total_questions,
    completed_at = v_now,
    local_date = complete_quiz_impl.local_date,
    timezone = complete_quiz_impl.timezone
  where id = v_attempt.id
  returning *
  into v_attempt;

  v_stamp_type := case
    when v_score = v_total_questions then 'perfect'::public.stamp_type
    else 'city'::public.stamp_type
  end;

  insert into public.user_stamps (
    user_id,
    season_id,
    city_id,
    daily_challenge_id,
    quiz_attempt_id,
    stamp_type,
    local_date,
    score,
    total_questions
  )
  values (
    v_attempt.user_id,
    v_challenge.season_id,
    v_challenge.city_id,
    v_challenge.id,
    v_attempt.id,
    v_stamp_type,
    complete_quiz_impl.local_date,
    v_score,
    v_total_questions
  )
  on conflict (user_id, daily_challenge_id) do update
    set
      quiz_attempt_id = excluded.quiz_attempt_id,
      stamp_type = excluded.stamp_type,
      local_date = excluded.local_date,
      score = excluded.score,
      total_questions = excluded.total_questions
  returning *
  into v_stamp;

  insert into public.user_streaks (user_id)
  values (v_attempt.user_id)
  on conflict (user_id) do nothing;

  select *
  into v_streak
  from public.user_streaks us
  where us.user_id = v_attempt.user_id
  for update;

  v_previous_current := coalesce(v_streak.current_streak, 0);

  if complete_quiz_impl.local_date = v_challenge.challenge_date then
    if v_streak.last_completed_local_date = complete_quiz_impl.local_date then
      v_was_incremented := false;
    elsif v_streak.last_completed_local_date = complete_quiz_impl.local_date - integer '1' then
      update public.user_streaks
      set
        current_streak = v_streak.current_streak + 1,
        longest_streak = greatest(v_streak.longest_streak, v_streak.current_streak + 1),
        last_completed_local_date = complete_quiz_impl.local_date
      where user_id = v_attempt.user_id
      returning *
      into v_streak;

      v_was_incremented := true;
    else
      update public.user_streaks
      set
        current_streak = 1,
        longest_streak = greatest(v_streak.longest_streak, 1),
        last_completed_local_date = complete_quiz_impl.local_date
      where user_id = v_attempt.user_id
      returning *
      into v_streak;

      v_was_incremented := true;
    end if;
  end if;

  return jsonb_build_object(
    'attempt',
    jsonb_build_object(
      'id', v_attempt.id,
      'status', 'completed',
      'score', v_attempt.score,
      'total_questions', v_attempt.total_questions,
      'completed_at', v_attempt.completed_at
    ),
    'stamp',
    jsonb_build_object(
      'id', v_stamp.id,
      'type', v_stamp.stamp_type,
      'city_name',
        (
          select c.name
          from public.cities c
          where c.id = v_challenge.city_id
        ),
      'collected_at', v_stamp.collected_at
    ),
    'streak',
    jsonb_build_object(
      'current_streak', v_streak.current_streak,
      'longest_streak', v_streak.longest_streak,
      'was_incremented',
        case
          when complete_quiz_impl.local_date = v_challenge.challenge_date
            then v_was_incremented
          else false
        end
    )
  );
end;
$$;

create or replace function public.complete_quiz(
  attempt_id uuid,
  local_date date,
  timezone text
)
returns jsonb
language sql
security definer
set search_path = public, private, extensions
as $$
  select private.complete_quiz_impl(attempt_id, local_date, timezone);
$$;

revoke all on function public.complete_quiz(uuid, date, text) from public, anon;

grant execute on function public.complete_quiz(uuid, date, text) to authenticated;
