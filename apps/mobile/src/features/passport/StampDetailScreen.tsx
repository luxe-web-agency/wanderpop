import type { GetStampDetailResponse } from '@wanderpop/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { getCurrentLocalDateContext } from '../../lib/date';
import { getStampDetail } from '../../services/passport';
import { theme } from '../../styles/theme';

type StampDetailState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; detail: GetStampDetailResponse };

function getStatusLabel(status: GetStampDetailResponse['stamp']['status']) {
  switch (status) {
    case 'perfect':
      return 'Perfect Stamp';
    case 'collected':
      return 'Collected';
    case 'missed':
      return 'Missed';
    case 'available_today':
      return 'Available Today';
    case 'upcoming':
    default:
      return 'Upcoming';
  }
}

export default function StampDetailScreen() {
  const { challengeId } = useLocalSearchParams<{ challengeId: string }>();
  const [screenState, setScreenState] = useState<StampDetailState>({ status: 'loading' });

  const loadDetail = useCallback(async () => {
    if (!challengeId) {
      setScreenState({
        status: 'error',
        message: 'This passport slot is missing its challenge context.',
      });
      return;
    }

    setScreenState({ status: 'loading' });

    try {
      const detail = await getStampDetail({
        daily_challenge_id: challengeId,
        ...getCurrentLocalDateContext(),
      });

      setScreenState({ status: 'ready', detail });
    } catch (error) {
      setScreenState({
        status: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Unable to load this stamp detail right now. Please try again.',
      });
    }
  }, [challengeId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  if (screenState.status === 'loading') {
    return (
      <Screen>
        <View style={styles.card}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <Text style={styles.title}>Loading stamp detail</Text>
        </View>
      </Screen>
    );
  }

  if (screenState.status === 'error') {
    return (
      <Screen>
        <View style={styles.card}>
          <Text style={styles.title}>Stamp detail unavailable</Text>
          <Text style={styles.body}>{screenState.message}</Text>
        </View>

        <View style={styles.actions}>
          <Button onPress={() => void loadDetail()}>Try Again</Button>
          <Button variant="secondary" onPress={() => router.back()}>
            Back to Passport
          </Button>
        </View>
      </Screen>
    );
  }

  const { detail } = screenState;
  const hasCollectedStamp = detail.stamp.collected_at !== null;

  return (
    <Screen>
      <View style={styles.card}>
        <Text style={styles.stamp}>
          {detail.stamp.status === 'perfect'
            ? '★'
            : detail.stamp.status === 'collected'
              ? '◎'
              : detail.stamp.status === 'missed'
                ? '○'
                : detail.stamp.status === 'available_today'
                  ? '◉'
                  : '◌'}
        </Text>
        <Text style={styles.title}>{detail.city.name}</Text>
        <Text style={styles.body}>
          {detail.city.country}
        </Text>
        <Text style={styles.body}>
          {detail.city.short_description ??
            'More city background will appear here once content details are available.'}
        </Text>

        <View style={styles.metaGroup}>
          <Text style={styles.metaLabel}>Status</Text>
          <Text style={styles.metaValue}>{getStatusLabel(detail.stamp.status)}</Text>
        </View>

        <View style={styles.metaGroup}>
          <Text style={styles.metaLabel}>Stamp Type</Text>
          <Text style={styles.metaValue}>{detail.stamp.type ?? 'Not collected yet'}</Text>
        </View>

        {detail.stamp.total_questions !== null ? (
          <View style={styles.metaGroup}>
            <Text style={styles.metaLabel}>Score</Text>
            <Text style={styles.metaValue}>
              {detail.stamp.score ?? 0} / {detail.stamp.total_questions}
            </Text>
          </View>
        ) : null}

        <View style={styles.metaGroup}>
          <Text style={styles.metaLabel}>Collected</Text>
          <Text style={styles.metaValue}>
            {hasCollectedStamp ? formatDate(detail.stamp.collected_at!) : getStateMessage(detail)}
          </Text>
        </View>
      </View>

      <Button variant="secondary" onPress={() => router.back()}>
        Back to Passport
      </Button>
    </Screen>
  );
}

function getStateMessage(detail: GetStampDetailResponse) {
  switch (detail.stamp.status) {
    case 'missed':
      return 'This city was missed and appears as a silhouette for now.';
    case 'available_today':
      return 'This city is available today once you start the quiz.';
    case 'upcoming':
      return 'This city unlocks later in the season.';
    default:
      return 'Not collected yet.';
  }
}

function formatDate(value: string) {
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
  stamp: {
    color: theme.colors.primary,
    fontSize: 64,
    fontWeight: '800',
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.heading,
    fontWeight: '800',
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
