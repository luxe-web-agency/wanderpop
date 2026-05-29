import type { PropsWithChildren } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import type { GuestSession } from '../services/auth';
import { ensureGuestSession } from '../services/auth';
import { theme } from '../styles/theme';

type AppSessionContextValue = {
  session: GuestSession;
};

const AppSessionContext = createContext<AppSessionContextValue | null>(null);

type BootstrapState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; session: GuestSession };

export function AppProvider({ children }: PropsWithChildren) {
  const [bootstrapState, setBootstrapState] = useState<BootstrapState>({
    status: 'loading',
  });

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
    void bootstrap();
  }, [bootstrap]);

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
