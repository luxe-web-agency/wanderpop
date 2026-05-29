import type { GetTodayChallengeRequest, TodayChallengeResponse } from '@wanderpop/shared';

import { supabase } from '../lib/supabase';

type ChallengeRow = {
  id: string;
  challenge_date: string;
  season_id: string;
  city_id: string;
};

type SeasonRow = {
  id: string;
  slug: string;
  name: string;
};

type CityRow = {
  id: string;
  slug: string;
  name: string;
  country: string;
  short_description: string | null;
  stamp_image_url: string | null;
  stamp_silhouette_url: string | null;
};

type AttemptRow = {
  id: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  score: number | null;
  total_questions: number | null;
};

type StampRow = {
  stamp_type: 'city' | 'perfect';
  score: number;
};

function createUnavailableResponse(): TodayChallengeResponse {
  return {
    challenge: null,
    user_status: {
      quiz_status: 'unavailable',
      attempt_id: null,
      answered_count: 0,
      total_questions: 0,
      stamp_type: null,
      score: null,
    },
  };
}

export async function getTodayChallenge(
  request: GetTodayChallengeRequest,
): Promise<TodayChallengeResponse> {
  const { data: challengeRow, error: challengeError } = await supabase
    .from('daily_challenges')
    .select('id, challenge_date, season_id, city_id')
    .eq('challenge_date', request.local_date)
    .eq('is_published', true)
    .maybeSingle<ChallengeRow>();

  if (challengeError) {
    throw challengeError;
  }

  if (!challengeRow) {
    return createUnavailableResponse();
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!userData.user) {
    throw new Error('Unable to resolve the current user for today’s challenge.');
  }

  const userId = userData.user.id;

  const [
    seasonResult,
    cityResult,
    questionsResult,
    attemptResult,
    stampResult,
  ] = await Promise.all([
    supabase
      .from('seasons')
      .select('id, slug, name')
      .eq('id', challengeRow.season_id)
      .maybeSingle<SeasonRow>(),
    supabase
      .from('cities')
      .select(
        'id, slug, name, country, short_description, stamp_image_url, stamp_silhouette_url',
      )
      .eq('id', challengeRow.city_id)
      .maybeSingle<CityRow>(),
    supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('daily_challenge_id', challengeRow.id)
      .eq('is_published', true),
    supabase
      .from('quiz_attempts')
      .select('id, status, score, total_questions')
      .eq('user_id', userId)
      .eq('daily_challenge_id', challengeRow.id)
      .maybeSingle<AttemptRow>(),
    supabase
      .from('user_stamps')
      .select('stamp_type, score')
      .eq('user_id', userId)
      .eq('daily_challenge_id', challengeRow.id)
      .maybeSingle<StampRow>(),
  ]);

  if (seasonResult.error) {
    throw seasonResult.error;
  }

  if (cityResult.error) {
    throw cityResult.error;
  }

  if (questionsResult.error) {
    throw questionsResult.error;
  }

  if (attemptResult.error) {
    throw attemptResult.error;
  }

  if (stampResult.error) {
    throw stampResult.error;
  }

  if (!seasonResult.data || !cityResult.data) {
    return createUnavailableResponse();
  }

  const totalQuestions = attemptResult.data?.total_questions ?? questionsResult.count ?? 0;

  let answeredCount = 0;

  if (attemptResult.data) {
    const { count, error: answersError } = await supabase
      .from('quiz_answers')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_attempt_id', attemptResult.data.id);

    if (answersError) {
      throw answersError;
    }

    answeredCount =
      attemptResult.data.status === 'completed'
        ? attemptResult.data.total_questions ?? count ?? totalQuestions
        : count ?? 0;
  }

  const isCompleted =
    attemptResult.data?.status === 'completed' || Boolean(stampResult.data);

  return {
    challenge: {
      id: challengeRow.id,
      date: challengeRow.challenge_date,
      season: seasonResult.data,
      city: cityResult.data,
    },
    user_status: {
      quiz_status: isCompleted
        ? 'completed'
        : attemptResult.data
          ? 'in_progress'
          : 'not_started',
      attempt_id: attemptResult.data?.id ?? null,
      answered_count: answeredCount,
      total_questions: totalQuestions,
      stamp_type: stampResult.data?.stamp_type ?? null,
      score: attemptResult.data?.score ?? stampResult.data?.score ?? null,
    },
  };
}
