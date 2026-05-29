import type {
  ChallengeSeasonSummary,
  GetPassportRequest,
  GetPassportResponse,
  GetStampDetailRequest,
  GetStampDetailResponse,
  PassportSlot,
  PassportSlotStatus,
} from '@wanderpop/shared';

import { supabase } from '../lib/supabase';

type SeasonRow = {
  id: string;
  slug: string;
  name: string;
};

type ChallengeRow = {
  id: string;
  challenge_date: string;
  city_id: string;
  city: {
    id: string;
    slug: string;
    name: string;
    country: string;
    short_description?: string | null;
  } | null;
};

type StampRow = {
  daily_challenge_id: string;
  stamp_type: 'city' | 'perfect';
  score: number;
  total_questions: number;
  collected_at: string;
};

type StreakRow = {
  current_streak: number;
  longest_streak: number;
};

type QuestionRow = {
  daily_challenge_id: string;
};

function getSlotStatus(
  challengeDate: string,
  localDate: string,
  stampType: StampRow['stamp_type'] | null,
): PassportSlotStatus {
  if (stampType === 'perfect') {
    return 'perfect';
  }

  if (stampType === 'city') {
    return 'collected';
  }

  if (challengeDate < localDate) {
    return 'missed';
  }

  if (challengeDate === localDate) {
    return 'available_today';
  }

  return 'upcoming';
}

export async function getActivePassportSeason(): Promise<ChallengeSeasonSummary> {
  const { data, error } = await supabase
    .from('seasons')
    .select('id, slug, name')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle<SeasonRow>();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('No active season is available right now.');
  }

  return data;
}

export async function getPassport(request: GetPassportRequest): Promise<GetPassportResponse> {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!userData.user) {
    throw new Error('You must be signed in to view your passport.');
  }

  const [seasonResult, challengesResult, stampsResult, streakResult] = await Promise.all([
    supabase
      .from('seasons')
      .select('id, slug, name')
      .eq('id', request.season_id)
      .maybeSingle<SeasonRow>(),
    supabase
      .from('daily_challenges')
      .select(
        `
          id,
          challenge_date,
          city_id,
          city:cities (
            id,
            slug,
            name,
            country,
            short_description
          )
        `,
      )
      .eq('season_id', request.season_id)
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .returns<ChallengeRow[]>(),
    supabase
      .from('user_stamps')
      .select('daily_challenge_id, stamp_type, score, total_questions, collected_at')
      .eq('user_id', userData.user.id)
      .eq('season_id', request.season_id)
      .returns<StampRow[]>(),
    supabase
      .from('user_streaks')
      .select('current_streak, longest_streak')
      .eq('user_id', userData.user.id)
      .maybeSingle<StreakRow>(),
  ]);

  if (seasonResult.error) {
    throw seasonResult.error;
  }

  if (!seasonResult.data) {
    throw new Error('Season not found.');
  }

  if (challengesResult.error) {
    throw challengesResult.error;
  }

  if (stampsResult.error) {
    throw stampsResult.error;
  }

  if (streakResult.error) {
    throw streakResult.error;
  }

  const challengeIds = (challengesResult.data ?? []).map((challenge) => challenge.id);
  const { data: questionRows, error: questionsError } = challengeIds.length
    ? await supabase
        .from('questions')
        .select('daily_challenge_id')
        .in('daily_challenge_id', challengeIds)
        .eq('is_published', true)
        .returns<QuestionRow[]>()
    : { data: [] as QuestionRow[], error: null };

  if (questionsError) {
    throw questionsError;
  }

  const questionCounts = new Map<string, number>();

  for (const row of questionRows ?? []) {
    questionCounts.set(
      row.daily_challenge_id,
      (questionCounts.get(row.daily_challenge_id) ?? 0) + 1,
    );
  }

  const stampsByChallengeId = new Map(
    (stampsResult.data ?? []).map((stamp) => [stamp.daily_challenge_id, stamp]),
  );

  const slots: PassportSlot[] = (challengesResult.data ?? [])
    .filter((challenge) => challenge.city)
    .map((challenge) => {
      const stamp = stampsByChallengeId.get(challenge.id) ?? null;
      const totalQuestions = stamp?.total_questions ?? questionCounts.get(challenge.id) ?? null;

      return {
        daily_challenge_id: challenge.id,
        date: challenge.challenge_date,
        city: {
          id: challenge.city!.id,
          slug: challenge.city!.slug,
          name: challenge.city!.name,
          country: challenge.city!.country,
        },
        status: getSlotStatus(
          challenge.challenge_date,
          request.local_date,
          stamp?.stamp_type ?? null,
        ),
        score: stamp?.score ?? null,
        total_questions: totalQuestions,
        stamp_type: stamp?.stamp_type ?? null,
        collected_at: stamp?.collected_at ?? null,
      };
    });

  return {
    season: seasonResult.data,
    streak: {
      current_streak: streakResult.data?.current_streak ?? 0,
      longest_streak: streakResult.data?.longest_streak ?? 0,
    },
    slots,
  };
}

export async function getStampDetail(
  request: GetStampDetailRequest,
): Promise<GetStampDetailResponse> {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!userData.user) {
    throw new Error('You must be signed in to view stamp details.');
  }

  const { data: challenge, error: challengeError } = await supabase
    .from('daily_challenges')
    .select(
      `
        id,
        challenge_date,
        city_id,
        city:cities (
          id,
          slug,
          name,
          country,
          short_description
        )
      `,
    )
    .eq('id', request.daily_challenge_id)
    .eq('is_published', true)
    .maybeSingle<ChallengeRow>();

  if (challengeError) {
    throw challengeError;
  }

  if (!challenge?.city) {
    throw new Error('Stamp detail is unavailable for this challenge.');
  }

  const [{ data: stamp, error: stampError }, { count, error: questionError }] = await Promise.all([
    supabase
      .from('user_stamps')
      .select('daily_challenge_id, stamp_type, score, total_questions, collected_at')
      .eq('user_id', userData.user.id)
      .eq('daily_challenge_id', request.daily_challenge_id)
      .maybeSingle<StampRow>(),
    supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('daily_challenge_id', request.daily_challenge_id)
      .eq('is_published', true),
  ]);

  if (stampError) {
    throw stampError;
  }

  if (questionError) {
    throw questionError;
  }

  return {
    city: {
      name: challenge.city.name,
      country: challenge.city.country,
      short_description: challenge.city.short_description ?? null,
    },
    stamp: {
      status: getSlotStatus(
        challenge.challenge_date,
        request.local_date,
        stamp?.stamp_type ?? null,
      ),
      type: stamp?.stamp_type ?? null,
      score: stamp?.score ?? null,
      total_questions: stamp?.total_questions ?? count ?? null,
      collected_at: stamp?.collected_at ?? null,
    },
  };
}
