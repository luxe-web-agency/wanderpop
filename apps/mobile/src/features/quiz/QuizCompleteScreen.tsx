import type { CompleteQuizResponse } from '@wanderpop/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { getCurrentLocalDateContext } from '../../lib/date';
import { completeQuiz } from '../../services/quiz';
import { theme } from '../../styles/theme';

type QuizCompleteState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; result: CompleteQuizResponse };

export default function QuizCompleteScreen() {
  const params = useLocalSearchParams<{ attemptId?: string | string[] }>();
  const attemptId = Array.isArray(params.attemptId) ? params.attemptId[0] : params.attemptId;
  const [screenState, setScreenState] = useState<QuizCompleteState>({ status: 'loading' });

  const loadResult = useCallback(async () => {
    if (!attemptId) {
      setScreenState({
        status: 'error',
        message:
          'This result is missing its attempt context. Please return to the quiz and try again.',
      });
      return;
    }

    setScreenState({ status: 'loading' });

    try {
      const result = await completeQuiz({
        attempt_id: attemptId,
        ...getCurrentLocalDateContext(),
      });

      setScreenState({ status: 'ready', result });
    } catch (error) {
      setScreenState({
        status: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Unable to finalize this quiz right now. Please try again.',
      });
    }
  }, [attemptId]);

  useEffect(() => {
    void loadResult();
  }, [loadResult]);

  if (screenState.status === 'loading') {
    return (
      <Screen>
        <View style={styles.card}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <Text style={styles.title}>Finalizing quiz</Text>
          <Text style={styles.body}>
            WanderPop is calculating your score, stamp, and streak result.
          </Text>
        </View>
      </Screen>
    );
  }

  if (screenState.status === 'error') {
    return (
      <Screen>
        <View style={styles.card}>
          <Text style={styles.badge}>Result unavailable</Text>
          <Text style={styles.title}>Quiz Complete</Text>
          <Text style={styles.body}>{screenState.message}</Text>
        </View>

        <View style={styles.actions}>
          <Button onPress={() => void loadResult()}>Try Again</Button>
          <Button variant="secondary" onPress={() => router.push('/home')}>
            Back to Home
          </Button>
        </View>
      </Screen>
    );
  }

  const { result } = screenState;

  return (
    <Screen>
      <View style={styles.card}>
        <Text style={styles.badge}>
          {result.stamp.type === 'perfect' ? 'Perfect Stamp' : 'City Stamp'}
        </Text>
        <Text style={styles.title}>Quiz Complete</Text>
        <Text style={styles.body}>
          {result.stamp.city_name} has been added to your passport. Your final result was
          calculated by the backend from your locked answers.
        </Text>

        <View style={styles.metaGroup}>
          <Text style={styles.metaLabel}>Score</Text>
          <Text style={styles.metaValue}>
            {result.attempt.score} / {result.attempt.total_questions}
          </Text>
        </View>

        <View style={styles.metaGroup}>
          <Text style={styles.metaLabel}>Completed</Text>
          <Text style={styles.metaValue}>{formatDateTime(result.attempt.completed_at)}</Text>
        </View>

        <View style={styles.metaGroup}>
          <Text style={styles.metaLabel}>Stamp Collected</Text>
          <Text style={styles.metaValue}>{formatDateTime(result.stamp.collected_at)}</Text>
        </View>

        <View style={styles.metaGroup}>
          <Text style={styles.metaLabel}>Current Streak</Text>
          <Text style={styles.metaValue}>{result.streak.current_streak}</Text>
        </View>

        <View style={styles.metaGroup}>
          <Text style={styles.metaLabel}>Longest Streak</Text>
          <Text style={styles.metaValue}>{result.streak.longest_streak}</Text>
        </View>

        <View style={styles.metaGroup}>
          <Text style={styles.metaLabel}>Streak Updated</Text>
          <Text style={styles.metaValue}>
            {result.streak.was_incremented ? 'Incremented today' : 'No streak change'}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button onPress={() => router.push('/passport')}>View Passport Shell</Button>
        <Button variant="secondary" onPress={() => router.push('/home')}>
          Back to Home
        </Button>
      </View>
    </Screen>
  );
}

function formatDateTime(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString();
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    gap: theme.spacing.md,
    padding: theme.spacing.xl,
  },
  badge: {
    color: theme.colors.primaryDark,
    fontSize: theme.typography.small,
    fontWeight: '700',
    textTransform: 'uppercase',
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
