import { ANALYTICS_EVENTS, type GetPassportResponse, type PassportSlot } from '@wanderpop/shared';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { getCurrentLocalDateContext } from '../../lib/date';
import { trackAnalyticsEvent } from '../../services/analytics';
import { getActivePassportSeason, getPassport } from '../../services/passport';
import { theme } from '../../styles/theme';

type PassportScreenState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; passport: GetPassportResponse };

function getSlotLabel(slot: PassportSlot) {
  switch (slot.status) {
    case 'perfect':
      return 'Perfect';
    case 'collected':
      return 'Collected';
    case 'missed':
      return 'Missed';
    case 'available_today':
      return 'Today';
    case 'upcoming':
    default:
      return 'Upcoming';
  }
}

export default function PassportScreen() {
  const [screenState, setScreenState] = useState<PassportScreenState>({ status: 'loading' });
  const trackedPassportOpenRef = useRef<string | null>(null);

  const loadPassport = useCallback(async () => {
    setScreenState({ status: 'loading' });

    try {
      const season = await getActivePassportSeason();
      const passport = await getPassport({
        season_id: season.id,
        ...getCurrentLocalDateContext(),
      });

      setScreenState({ status: 'ready', passport });
    } catch (error) {
      setScreenState({
        status: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Unable to load your passport right now. Please try again.',
      });
    }
  }, []);

  useEffect(() => {
    void loadPassport();
  }, [loadPassport]);

  useEffect(() => {
    if (screenState.status !== 'ready') {
      return;
    }

    const eventKey = screenState.passport.season.id;

    if (trackedPassportOpenRef.current === eventKey) {
      return;
    }

    trackedPassportOpenRef.current = eventKey;

    trackAnalyticsEvent(ANALYTICS_EVENTS.PASSPORT_OPENED, {
      season_slug: screenState.passport.season.slug,
      collected_count: screenState.passport.slots.filter(
        (slot) => slot.status === 'collected' || slot.status === 'perfect',
      ).length,
      perfect_count: screenState.passport.slots.filter((slot) => slot.status === 'perfect').length,
      missed_count: screenState.passport.slots.filter((slot) => slot.status === 'missed').length,
    });
  }, [screenState]);

  const slots = useMemo(
    () => (screenState.status === 'ready' ? screenState.passport.slots : []),
    [screenState],
  );

  if (screenState.status === 'loading') {
    return (
      <Screen scroll>
        <View style={styles.header}>
          <Text style={styles.title}>Season Passport</Text>
          <Text style={styles.body}>Loading your seasonal collection.</Text>
        </View>

        <View style={styles.loadingCard}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      </Screen>
    );
  }

  if (screenState.status === 'error') {
    return (
      <Screen scroll>
        <View style={styles.header}>
          <Text style={styles.title}>Season Passport</Text>
          <Text style={styles.body}>{screenState.message}</Text>
        </View>

        <View style={styles.actions}>
          <Button onPress={() => void loadPassport()}>Try Again</Button>
          <Button variant="secondary" onPress={() => router.push('/home')}>
            Back to Home
          </Button>
        </View>
      </Screen>
    );
  }

  const { passport } = screenState;

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.title}>{passport.season.name}</Text>
        <Text style={styles.body}>
          Track collected cities, Perfect Stamps, missed silhouettes, and upcoming passport
          slots for the current season.
        </Text>
      </View>

      <View style={styles.streakCard}>
        <View style={styles.streakGroup}>
          <Text style={styles.streakLabel}>Current Streak</Text>
          <Text style={styles.streakValue}>{passport.streak.current_streak}</Text>
        </View>
        <View style={styles.streakGroup}>
          <Text style={styles.streakLabel}>Longest Streak</Text>
          <Text style={styles.streakValue}>{passport.streak.longest_streak}</Text>
        </View>
      </View>

      {slots.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No passport slots yet</Text>
          <Text style={styles.body}>
            Published season challenges will appear here once content is available.
          </Text>
        </View>
      ) : null}

      <View style={styles.grid}>
        {slots.map((slot) => (
          <Pressable
            accessibilityRole="button"
            key={slot.daily_challenge_id}
            onPress={() =>
              router.push({
                pathname: '/passport/[challengeId]',
                params: { challengeId: slot.daily_challenge_id },
              })
            }
            style={[
              styles.slot,
              slot.status === 'perfect' && styles.slotPerfect,
              slot.status === 'collected' && styles.slotCollected,
              slot.status === 'missed' && styles.slotMissed,
              slot.status === 'available_today' && styles.slotToday,
            ]}
          >
            <Text
              style={[
                styles.stamp,
                slot.status === 'missed' && styles.stampMissed,
                slot.status === 'upcoming' && styles.stampUpcoming,
              ]}
            >
              {slot.status === 'perfect'
                ? '★'
                : slot.status === 'collected'
                  ? '◎'
                  : slot.status === 'missed'
                    ? '○'
                    : slot.status === 'available_today'
                      ? '◉'
                      : '◌'}
            </Text>
            <Text style={styles.slotLabel}>{getSlotLabel(slot)}</Text>
            <Text style={styles.city}>{slot.city.name}</Text>
            <Text style={styles.country}>{slot.city.country}</Text>
            <Text style={styles.date}>{slot.date}</Text>
            {slot.score !== null && slot.total_questions !== null ? (
              <Text style={styles.score}>
                {slot.score} / {slot.total_questions}
              </Text>
            ) : null}
          </Pressable>
        ))}
      </View>

      <Button variant="secondary" onPress={() => router.push('/home')}>
        Back to Home
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: theme.spacing.sm,
  },
  loadingCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 180,
    padding: theme.spacing.xl,
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
  streakCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
  },
  streakGroup: {
    gap: theme.spacing.xs,
  },
  streakLabel: {
    color: theme.colors.primaryDark,
    fontSize: theme.typography.small,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  streakValue: {
    color: theme.colors.text,
    fontSize: theme.typography.heading,
    fontWeight: '800',
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  slot: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.sm,
    minHeight: 132,
    padding: theme.spacing.md,
    width: '47%',
  },
  slotPerfect: {
    borderColor: theme.colors.secondary,
  },
  slotCollected: {
    borderColor: theme.colors.primary,
  },
  slotMissed: {
    opacity: 0.75,
  },
  slotToday: {
    borderColor: theme.colors.primaryDark,
  },
  stamp: {
    color: theme.colors.primary,
    fontSize: 44,
    fontWeight: '800',
  },
  stampMissed: {
    color: theme.colors.mutedText,
  },
  stampUpcoming: {
    color: theme.colors.border,
  },
  slotLabel: {
    color: theme.colors.primaryDark,
    fontSize: theme.typography.small,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  city: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontWeight: '700',
    textAlign: 'center',
  },
  country: {
    color: theme.colors.mutedText,
    fontSize: theme.typography.small,
    textAlign: 'center',
  },
  date: {
    color: theme.colors.mutedText,
    fontSize: theme.typography.small,
    textAlign: 'center',
  },
  score: {
    color: theme.colors.text,
    fontSize: theme.typography.small,
    fontWeight: '700',
    textAlign: 'center',
  },
  actions: {
    gap: theme.spacing.md,
  },
});
