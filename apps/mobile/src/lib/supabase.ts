import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// #region agent log
void fetch('http://127.0.0.1:7875/ingest/91b48049-e3a7-4aeb-b7ec-e6693e1384e7', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Debug-Session-Id': 'a3f890',
  },
  body: JSON.stringify({
    sessionId: 'a3f890',
    runId: 'runtime-probe',
    hypothesisId: 'H1-env-loading',
    location: 'apps/mobile/src/lib/supabase.ts:4',
    message: 'Supabase env snapshot at module load',
    data: {
      hasSupabaseUrl: Boolean(supabaseUrl),
      supabaseUrlLength: supabaseUrl?.length ?? 0,
      hasPublishableKey: Boolean(supabasePublishableKey),
      publishableKeyLength: supabasePublishableKey?.length ?? 0,
      urlSource: 'EXPO_PUBLIC_SUPABASE_URL',
      keySources: ['EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'EXPO_PUBLIC_SUPABASE_ANON_KEY'],
    },
    timestamp: Date.now(),
  }),
}).catch(() => {});
// #endregion agent log

if (!supabaseUrl) {
  // #region agent log
  void fetch('http://127.0.0.1:7875/ingest/91b48049-e3a7-4aeb-b7ec-e6693e1384e7', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': 'a3f890',
    },
    body: JSON.stringify({
      sessionId: 'a3f890',
      runId: 'runtime-probe',
      hypothesisId: 'H1-env-loading',
      location: 'apps/mobile/src/lib/supabase.ts:9',
      message: 'Missing Supabase URL branch taken',
      data: {
        hasSupabaseUrl: false,
        hasPublishableKey: Boolean(supabasePublishableKey),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion agent log
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL environment variable.');
}

if (!supabasePublishableKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY environment variable.',
  );
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
