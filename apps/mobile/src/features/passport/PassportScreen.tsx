import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { theme } from '../../styles/theme';

const placeholderSlots = [
  { challengeId: 'placeholder-seoul', city: 'Seoul' },
  { challengeId: 'placeholder-kyoto', city: 'Kyoto' },
  { challengeId: 'placeholder-bangkok', city: 'Bangkok' },
  { challengeId: 'placeholder-lisbon', city: 'Lisbon' },
  { challengeId: 'placeholder-mexico-city', city: 'Mexico City' },
];

export default function PassportScreen() {
  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.title}>Season Passport</Text>
        <Text style={styles.body}>
          Placeholder slots show the future layout for collected, perfect, missed, and
          upcoming cities.
        </Text>
      </View>

      <View style={styles.grid}>
        {placeholderSlots.map((slot) => (
          <Pressable
            accessibilityRole="button"
            key={slot.challengeId}
            onPress={() =>
              router.push({
                pathname: '/passport/[challengeId]',
                params: { challengeId: slot.challengeId },
              })
            }
            style={styles.slot}
          >
            <Text style={styles.stamp}>◎</Text>
            <Text style={styles.city}>{slot.city}</Text>
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
  stamp: {
    color: theme.colors.primary,
    fontSize: 44,
    fontWeight: '800',
  },
  city: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontWeight: '700',
    textAlign: 'center',
  },
});
