import type { TodayChallengeResponse } from '@wanderpop/shared';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { getCurrentLocalDateContext } from '../../lib/date';
import { useAppSession } from '../../providers/AppProvider';
import { getTodayChallenge } from '../../services/challenges';
import { theme } from '../../styles/theme';

type HomeState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; challenge: TodayChallengeResponse };

function getPrimaryAction(challenge: TodayChallengeResponse) {
  const activeChallenge = challenge.challenge;

  if (!activeChallenge) {
    return {
      label: 'Quiz Unavailable Today',
      onPress: () => undefined,
      disabled: true,
    };
  }

  switch (challenge.user_status.quiz_status) {
    case 'completed':
      return {
        label: 'View Result',
        onPress: () => router.push('/quiz-complete'),
      };
    case 'in_progress':
      return {
        label: 'Continue Quiz',
        onPress: () =>
          router.push({
            pathname: '/quiz',
            params: { challengeId: activeChallenge.id },
          }),
      };
    case 'unavailable':
      return {
        label: 'Quiz Unavailable Today',
        onPress: () => undefined,
        disabled: true,
      };
    case 'missed':
      return {
        label: 'Today Is Unavailable',
        onPress: () => undefined,
        disabled: true,
      };
    case 'not_started':
    default:
      return {
        label: 'Start Quiz',
        onPress: () =>
          router.push({
            pathname: '/quiz',
            params: { challengeId: activeChallenge.id },
          }),
      };
  }
}

export default function HomeScreen() {
  const { session } = useAppSession();
  const [homeState, setHomeState] = useState<HomeState>({ status: 'loading' });

  const loadChallenge = useCallback(async () => {
    setHomeState({ status: 'loading' });

    try {
      const challenge = await getTodayChallenge(getCurrentLocalDateContext());
      setHomeState({ status: 'ready', challenge });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to load today\'s challenge right now.';

      setHomeState({ status: 'error', message });
    }
  }, []);

  useEffect(() => {
    void loadChallenge();
  }, [loadChallenge, session.userId]);

  const primaryAction = useMemo(() => {
    if (homeState.status !== 'ready') {
      return null;
    }

    return getPrimaryAction(homeState.challenge);
  }, [homeState]);

  if (homeState.status === 'loading') {
    return (
      <Screen>
        <View style={styles.card}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <Text style={styles.title}>Loading today&apos;s challenge</Text>
          <Text style={styles.body}>
            WanderPop is checking the published city for your local date.
          </Text>
        </View>

        <View style={styles.actions}>
          <Button variant="secondary" onPress={() => router.push('/passport')}>
            Open Passport Shell
          </Button>
          <Button variant="secondary" onPress={() => router.push('/account')}>
            Account
          </Button>
        </View>
      </Screen>
    );
  }

  if (homeState.status === 'error') {
    return (
      <Screen>
        <View style={styles.card}>
          <Text style={styles.label}>Today&apos;s city</Text>
          <Text style={styles.title}>Challenge unavailable</Text>
          <Text style={styles.body}>{homeState.message}</Text>
        </View>

        <View style={styles.actions}>
          <Button onPress={() => void loadChallenge()}>Try Again</Button>
          <Button variant="secondary" onPress={() => router.push('/passport')}>
            Open Passport Shell
          </Button>
          <Button variant="secondary" onPress={() => router.push('/account')}>
            Account
          </Button>
        </View>
      </Screen>
    );
  }

  const { challenge, user_status: userStatus } = homeState.challenge;
  const challengeUnavailable = !challenge;

  return (
    <Screen>
      <View style={styles.card}>
        <Text style={styles.label}>Today&apos;s city</Text>
        <Text style={styles.title}>{challenge?.city.name ?? 'No published challenge'}</Text>
        <Text style={styles.subtitle}>
          {challenge ? `${challenge.city.country} - ${challenge.date}` : 'Check back later.'}
        </Text>
        <Text style={styles.body}>
          {challenge?.city.short_description ??
            'There is no published city for your current local date yet.'}
        </Text>

        <View style={styles.metaGroup}>
          <Text style={styles.metaLabel}>Quiz status</Text>
          <Text style={styles.metaValue}>{userStatus.quiz_status.replaceAll('_', ' ')}</Text>
        </View>

        {!challengeUnavailable ? (
          <>
            <View style={styles.metaGroup}>
              <Text style={styles.metaLabel}>Questions</Text>
              <Text style={styles.metaValue}>
                {userStatus.answered_count} of {userStatus.total_questions} answered
              </Text>
            </View>

            {userStatus.score !== null ? (
              <View style={styles.metaGroup}>
                <Text style={styles.metaLabel}>Score</Text>
                <Text style={styles.metaValue}>
                  {userStatus.score} / {userStatus.total_questions}
                </Text>
              </View>
            ) : null}

            {userStatus.stamp_type ? (
              <View style={styles.metaGroup}>
                <Text style={styles.metaLabel}>Stamp</Text>
                <Text style={styles.metaValue}>{userStatus.stamp_type}</Text>
              </View>
            ) : null}
          </>
        ) : null}
      </View>

      <View style={styles.actions}>
        {primaryAction ? (
          <Button disabled={primaryAction.disabled} onPress={primaryAction.onPress}>
            {primaryAction.label}
          </Button>
        ) : null}
        <Button variant="secondary" onPress={() => router.push('/passport')}>
          Open Passport Shell
        </Button>
        <Button variant="secondary" onPress={() => router.push('/account')}>
          Account
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  label: {
    color: theme.colors.primaryDark,
    fontSize: theme.typography.small,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.heading,
    fontWeight: '800',
  },
  subtitle: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontWeight: '600',
  },
  body: {
    color: theme.colors.mutedText,
    fontSize: theme.typography.body,
    lineHeight: 24,
  },
  metaGroup: {
    gap: theme.spacing.xs,
  },
  metaLabel: {
    color: theme.colors.primaryDark,
    fontSize: theme.typography.small,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metaValue: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontWeight: '600',
  },
  actions: {
    gap: theme.spacing.md,
  },
});
