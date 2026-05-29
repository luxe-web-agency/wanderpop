import { ANALYTICS_EVENTS, getTodayLocalDate } from '@wanderpop/shared';
import type { PropsWithChildren } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  AppState,
  type AppStateStatus,
  Linking,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { supabase } from '../lib/supabase';
import type { AppSession } from '../services/auth';
import { trackAnalyticsEvent } from '../services/analytics';
import { ensureGuestSession, handleAuthCallbackUrl } from '../services/auth';
import { theme } from '../styles/theme';

type AppSessionContextValue = {
  session: AppSession;
};

const AppSessionContext = createContext<AppSessionContextValue | null>(null);

type BootstrapState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; session: AppSession };

const APP_OPEN_FOREGROUND_THRESHOLD_MS = 30_000;

export function AppProvider({ children }: PropsWithChildren) {
  const [bootstrapState, setBootstrapState] = useState<BootstrapState>({
    status: 'loading',
  });
  const hasTrackedInitialOpenRef = useRef(false);
  const previousSessionRef = useRef<AppSession | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const lastBackgroundedAtRef = useRef<number | null>(null);

  const bootstrap = useCallback(async () => {
    setBootstrapState({ status: 'loading' });

    try {
      const session = await ensureGuestSession();
      setBootstrapState({ status: 'ready', session });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to start guest play right now. Please try again.';

      setBootstrapState({ status: 'error', message });
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function processUrl(url: string) {
      try {
        return await handleAuthCallbackUrl(url);
      } catch {
        return false;
      }
    }

    async function initialize() {
      const initialUrl = await Linking.getInitialURL();
      const handled = initialUrl ? await processUrl(initialUrl) : false;

      if (!handled && isMounted) {
        await bootstrap();
      }
    }

    void initialize();

    const urlSubscription = Linking.addEventListener('url', ({ url }) => {
      void processUrl(url).then((handled) => {
        if (handled) {
          void bootstrap();
        }
      });
    });

    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange(() => {
      void bootstrap();
    });

    return () => {
      isMounted = false;
      urlSubscription.remove();
      authSubscription.unsubscribe();
    };
  }, [bootstrap]);

  useEffect(() => {
    if (bootstrapState.status !== 'ready') {
      return;
    }

    const nextSession = bootstrapState.session;
    const previousSession = previousSessionRef.current;

    if (!hasTrackedInitialOpenRef.current) {
      hasTrackedInitialOpenRef.current = true;
      trackAnalyticsEvent(ANALYTICS_EVENTS.APP_OPENED, {
        user_type: nextSession.isGuest ? 'guest' : 'registered',
        local_date: getTodayLocalDate(),
      });
    }

    if (previousSession?.isGuest && !nextSession.isGuest) {
      trackAnalyticsEvent(ANALYTICS_EVENTS.SIGNUP_COMPLETED, {
        method: 'email_magic_link',
        had_guest_progress: true,
      });
    }

    previousSessionRef.current = nextSession;
  }, [bootstrapState]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const previousAppState = appStateRef.current;
      appStateRef.current = nextAppState;

      if (previousAppState === 'active' && nextAppState !== 'active') {
        lastBackgroundedAtRef.current = Date.now();
        return;
      }

      const backgroundedAt = lastBackgroundedAtRef.current;
      const shouldTrackForegroundOpen =
        previousAppState !== 'active' &&
        nextAppState === 'active' &&
        backgroundedAt !== null &&
        Date.now() - backgroundedAt >= APP_OPEN_FOREGROUND_THRESHOLD_MS &&
        bootstrapState.status === 'ready';

      if (shouldTrackForegroundOpen) {
        trackAnalyticsEvent(ANALYTICS_EVENTS.APP_OPENED, {
          user_type: bootstrapState.session.isGuest ? 'guest' : 'registered',
          local_date: getTodayLocalDate(),
        });
      }

      if (nextAppState === 'active') {
        lastBackgroundedAtRef.current = null;
      }
    });

    return () => {
      subscription.remove();
    };
  }, [bootstrapState]);

  const contextValue = useMemo<AppSessionContextValue | null>(() => {
    if (bootstrapState.status !== 'ready') {
      return null;
    }

    return {
      session: bootstrapState.session,
    };
  }, [bootstrapState]);

  if (bootstrapState.status === 'loading') {
    return (
      <Screen>
        <View style={styles.centeredCard}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <Text style={styles.title}>Preparing guest session</Text>
          <Text style={styles.body}>
            WanderPop is creating or restoring your guest profile so progress can be saved.
          </Text>
        </View>
      </Screen>
    );
  }

  if (bootstrapState.status === 'error') {
    return (
      <Screen>
        <View style={styles.centeredCard}>
          <Text style={styles.title}>Guest session unavailable</Text>
          <Text style={styles.body}>{bootstrapState.message}</Text>
        </View>

        <Button onPress={() => void bootstrap()}>Try Again</Button>
      </Screen>
    );
  }

  return (
    <AppSessionContext.Provider value={contextValue}>{children}</AppSessionContext.Provider>
  );
}

export function useAppSession() {
  const value = useContext(AppSessionContext);

  if (!value) {
    throw new Error('useAppSession must be used within AppProvider.');
  }

  return value;
}

const styles = StyleSheet.create({
  centeredCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.md,
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.heading,
    fontWeight: '800',
    textAlign: 'center',
  },
  body: {
    color: theme.colors.mutedText,
    fontSize: theme.typography.body,
    lineHeight: 24,
    textAlign: 'center',
  },
});
