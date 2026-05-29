create or replace function private.quiz_questions_payload(
  p_daily_challenge_id uuid,
  p_quiz_attempt_id uuid
)
returns jsonb
language sql
security definer
set search_path = public, private, extensions
as $$
  select coalesce(
    jsonb_agg(question_payload order by question_order),
    '[]'::jsonb
  )
  from (
    select
      q.question_order,
      jsonb_build_object(
        'id', q.id,
        'order', q.question_order,
        'difficulty', q.difficulty,
        'question_text', q.question_text,
        'options',
          (
            select coalesce(
              jsonb_agg(
                jsonb_build_object(
                  'id', qo.id,
                  'order', qo.option_order,
                  'text', qo.option_text
                )
                order by qo.option_order
              ),
              '[]'::jsonb
            )
            from public.question_options qo
            where qo.question_id = q.id
          ),
        'answered', qa.selected_option_id is not null,
        'selected_option_id', qa.selected_option_id
      ) as question_payload
    from public.questions q
    left join public.quiz_answers qa
      on qa.quiz_attempt_id = p_quiz_attempt_id
      and qa.question_id = q.id
    where q.daily_challenge_id = p_daily_challenge_id
      and q.is_published = true
  ) ordered_questions;
$$;

create or replace function private.start_quiz_impl(
  daily_challenge_id uuid,
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
  v_answered_count integer := 0;
  v_total_questions integer := 0;
  v_questions jsonb := '[]'::jsonb;
begin
  if v_user_id is null then
    raise exception 'UNAUTHORIZED';
  end if;

  if not exists (
    select 1
    from public.daily_challenges dc
    where dc.id = daily_challenge_id
      and dc.is_published = true
  ) then
    raise exception 'CHALLENGE_NOT_AVAILABLE';
  end if;

  select *
  into v_attempt
  from public.quiz_attempts qa
  where qa.user_id = v_user_id
    and qa.daily_challenge_id = start_quiz_impl.daily_challenge_id;

  if not found then
    select count(*)
    into v_total_questions
    from public.questions q
    where q.daily_challenge_id = start_quiz_impl.daily_challenge_id
      and q.is_published = true;

    insert into public.quiz_attempts (
      user_id,
      daily_challenge_id,
      local_date,
      timezone,
      total_questions
    )
    values (
      v_user_id,
      start_quiz_impl.daily_challenge_id,
      start_quiz_impl.local_date,
      start_quiz_impl.timezone,
      v_total_questions
    )
    returning *
    into v_attempt;
  else
    select count(*)
    into v_answered_count
    from public.quiz_answers qa
    where qa.quiz_attempt_id = v_attempt.id;

    v_total_questions := coalesce(
      v_attempt.total_questions,
      (
        select count(*)
        from public.questions q
        where q.daily_challenge_id = v_attempt.daily_challenge_id
          and q.is_published = true
      )
    );
  end if;

  v_total_questions := coalesce(v_attempt.total_questions, v_total_questions, 0);
  v_questions := private.quiz_questions_payload(v_attempt.daily_challenge_id, v_attempt.id);

  return jsonb_build_object(
    'attempt',
    jsonb_build_object(
      'id', v_attempt.id,
      'status', case when v_attempt.status = 'completed' then 'completed' else 'in_progress' end,
      'started_at', v_attempt.started_at,
      'answered_count', v_answered_count,
      'total_questions', v_total_questions
    ),
    'questions',
    v_questions
  );
end;
$$;

create or replace function private.submit_answer_impl(
  attempt_id uuid,
  question_id uuid,
  selected_option_id uuid,
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
  v_question public.questions%rowtype;
  v_existing_answer public.quiz_answers%rowtype;
  v_correct_option_id uuid;
  v_is_correct boolean := false;
  v_answer public.quiz_answers%rowtype;
  v_answered_count integer := 0;
  v_total_questions integer := 0;
begin
  perform local_date;
  perform timezone;

  if v_user_id is null then
    raise exception 'UNAUTHORIZED';
  end if;

  select *
  into v_attempt
  from public.quiz_attempts qa
  where qa.id = submit_answer_impl.attempt_id
    and qa.user_id = v_user_id;

  if not found then
    raise exception 'UNAUTHORIZED';
  end if;

  if v_attempt.status = 'completed' then
    raise exception 'QUIZ_ALREADY_COMPLETED';
  end if;

  select *
  into v_question
  from public.questions q
  where q.id = submit_answer_impl.question_id
    and q.daily_challenge_id = v_attempt.daily_challenge_id
    and q.is_published = true;

  if not found then
    raise exception 'QUESTION_NOT_IN_ATTEMPT';
  end if;

  select *
  into v_existing_answer
  from public.quiz_answers qa
  where qa.quiz_attempt_id = v_attempt.id
    and qa.question_id = v_question.id;

  if found then
    raise exception 'ANSWER_ALREADY_SUBMITTED';
  end if;

  select qo.id
  into v_correct_option_id
  from public.question_options qo
  where qo.question_id = v_question.id
    and qo.is_correct = true;

  if not exists (
    select 1
    from public.question_options qo
    where qo.id = submit_answer_impl.selected_option_id
      and qo.question_id = v_question.id
  ) then
    raise exception 'OPTION_NOT_IN_QUESTION';
  end if;

  v_is_correct := submit_answer_impl.selected_option_id = v_correct_option_id;

  begin
    insert into public.quiz_answers (
      quiz_attempt_id,
      question_id,
      selected_option_id,
      is_correct
    )
    values (
      v_attempt.id,
      v_question.id,
      submit_answer_impl.selected_option_id,
      v_is_correct
    )
    returning *
    into v_answer;
  exception
    when unique_violation then
      raise exception 'ANSWER_ALREADY_SUBMITTED';
  end;

  select count(*)
  into v_answered_count
  from public.quiz_answers qa
  where qa.quiz_attempt_id = v_attempt.id;

  v_total_questions := coalesce(
    v_attempt.total_questions,
    (
      select count(*)
      from public.questions q
      where q.daily_challenge_id = v_attempt.daily_challenge_id
        and q.is_published = true
    )
  );

  return jsonb_build_object(
    'answer',
    jsonb_build_object(
      'question_id', v_answer.question_id,
      'selected_option_id', v_answer.selected_option_id,
      'is_correct', v_answer.is_correct,
      'correct_option_id', v_correct_option_id,
      'answered_at', v_answer.answered_at
    ),
    'feedback',
    jsonb_build_object(
      'result', case when v_answer.is_correct then 'correct' else 'incorrect' end,
      'fun_fact', v_question.fun_fact
    ),
    'attempt',
    jsonb_build_object(
      'id', v_attempt.id,
      'status', 'in_progress',
      'answered_count', v_answered_count,
      'total_questions', coalesce(v_total_questions, 0)
    )
  );
end;
$$;

create or replace function public.start_quiz(
  daily_challenge_id uuid,
  local_date date,
  timezone text
)
returns jsonb
language sql
security definer
set search_path = public, private, extensions
as $$
  select private.start_quiz_impl(daily_challenge_id, local_date, timezone);
$$;

create or replace function public.submit_answer(
  attempt_id uuid,
  question_id uuid,
  selected_option_id uuid,
  local_date date,
  timezone text
)
returns jsonb
language sql
security definer
set search_path = public, private, extensions
as $$
  select private.submit_answer_impl(attempt_id, question_id, selected_option_id, local_date, timezone);
$$;

revoke all on function public.start_quiz(uuid, date, text) from public, anon;
revoke all on function public.submit_answer(uuid, uuid, uuid, date, text) from public, anon;

grant execute on function public.start_quiz(uuid, date, text) to authenticated;
grant execute on function public.submit_answer(uuid, uuid, uuid, date, text) to authenticated;
