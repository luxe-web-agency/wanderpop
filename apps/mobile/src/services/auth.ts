import { ANALYTICS_EVENTS, getTodayLocalDate, type AccountType, type Profile, type Uuid } from '@wanderpop/shared';

import { supabase } from '../lib/supabase';
import { trackAnalyticsEvent } from './analytics';

const PROFILE_FETCH_RETRY_DELAYS_MS = [0, 150, 300] as const;
const MAGIC_LINK_REDIRECT_URL = 'wanderpop://auth/callback';

export type AppSession = {
  userId: Uuid;
  accountType: AccountType;
  email: string | null;
  isGuest: boolean;
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

function buildAppSession(user: { id: string; email?: string | null; is_anonymous?: boolean }, profile: Profile): AppSession {
  const isGuest = user.is_anonymous ?? (profile.account_type === 'guest' && !user.email);

  return {
    userId: user.id,
    accountType: profile.account_type,
    email: user.email ?? null,
    isGuest,
  };
}

export async function getAppSession(
  createGuestIfMissing = false,
): Promise<AppSession | null> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  let activeSession = sessionData.session;

  if (!activeSession && createGuestIfMissing) {
    const { data: anonymousData, error: anonymousError } =
      await supabase.auth.signInAnonymously();

    if (anonymousError) {
      throw anonymousError;
    }

    if (!anonymousData.session) {
      throw new Error('Anonymous sign-in did not return a session.');
    }

    activeSession = anonymousData.session;
    trackAnalyticsEvent(ANALYTICS_EVENTS.GUEST_CREATED, {
      local_date: getTodayLocalDate(),
    });
  }

  if (!activeSession) {
    return null;
  }

  const userId = activeSession.user.id;
  const profile = await getProfile(userId);
  await updateLastSeen(userId);

  return buildAppSession(activeSession.user, profile);
}

async function updateLastSeen(userId: Uuid) {
  const lastSeenAt = new Date().toISOString();

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ last_seen_at: lastSeenAt })
    .eq('id', userId);

  if (updateError) {
    throw updateError;
  }
}

export async function ensureGuestSession(): Promise<AppSession> {
  const appSession = await getAppSession(true);

  if (!appSession) {
    throw new Error('Unable to create or restore a session.');
  }

  return appSession;
}

export async function startEmailMagicLink(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error('Enter an email address to receive a magic link.');
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      emailRedirectTo: MAGIC_LINK_REDIRECT_URL,
    },
  });

  if (error) {
    throw error;
  }
}

function getUrlParams(url: string) {
  const parsedUrl = new URL(url);
  const params = new URLSearchParams(parsedUrl.search);
  const hash = parsedUrl.hash.startsWith('#') ? parsedUrl.hash.slice(1) : parsedUrl.hash;

  if (hash) {
    const hashParams = new URLSearchParams(hash);

    for (const [key, value] of hashParams.entries()) {
      if (!params.has(key)) {
        params.set(key, value);
      }
    }
  }

  return params;
}

export async function handleAuthCallbackUrl(url: string) {
  if (!url.startsWith(MAGIC_LINK_REDIRECT_URL)) {
    return false;
  }

  const params = getUrlParams(url);
  const errorCode = params.get('error_code') ?? params.get('errorCode');

  if (errorCode) {
    throw new Error(errorCode);
  }

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (!accessToken || !refreshToken) {
    return false;
  }

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    throw error;
  }

  return true;
}
