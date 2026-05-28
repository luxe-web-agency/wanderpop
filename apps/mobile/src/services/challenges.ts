import type { GetTodayChallengeRequest, TodayChallengeResponse } from '@wanderpop/shared';

import { supabase } from '../lib/supabase';

export async function getTodayChallenge(
  request: GetTodayChallengeRequest,
): Promise<TodayChallengeResponse> {
  void supabase;
  void request;

  throw new Error('Not implemented: getTodayChallenge');
}
