import type { AccountType, Profile, Uuid } from '@wanderpop/shared';

import { supabase } from '../lib/supabase';

const PROFILE_FETCH_RETRY_DELAYS_MS = [0, 150, 300] as const;

export type GuestSession = {
  userId: Uuid;
  accountType: AccountType;
};

async function wait(delayMs: number) {
  await new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

async function getProfile(userId: Uuid): Promise<Profile> {
  let lastError: Error | null = null;

  for (const delayMs of PROFILE_FETCH_RETRY_DELAYS_MS) {
    if (delayMs > 0) {
      await wait(delayMs);
    }

    const { data, error } = await supabase
      .from('profiles')
      .select(
        'id, display_name, account_type, created_at, updated_at, last_seen_at, preferred_language',
      )
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      lastError = error;
      continue;
    }

    if (data) {
      return data;
    }
  }

  throw lastError ?? new Error('Guest profile was not created.');
}

export async function ensureGuestSession(): Promise<GuestSession> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  let activeSession = sessionData.session;

  if (!activeSession) {
    const { data: anonymousData, error: anonymousError } =
      await supabase.auth.signInAnonymously();

    if (anonymousError) {
      throw anonymousError;
    }

    if (!anonymousData.session) {
      throw new Error('Anonymous sign-in did not return a session.');
    }

    activeSession = anonymousData.session;
  }

  const userId = activeSession.user.id;
  const profile = await getProfile(userId);
  const lastSeenAt = new Date().toISOString();

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ last_seen_at: lastSeenAt })
    .eq('id', userId);

  if (updateError) {
    throw updateError;
  }

  return {
    userId,
    accountType: profile.account_type,
  };
}
