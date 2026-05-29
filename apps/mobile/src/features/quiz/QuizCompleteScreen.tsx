import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { theme } from '../../styles/theme';

export default function QuizCompleteScreen() {
  return (
    <Screen>
      <View style={styles.card}>
        <Text style={styles.badge}>Result placeholder</Text>
        <Text style={styles.title}>Quiz Complete</Text>
        <Text style={styles.body}>
          This screen is reserved for backend-calculated score, stamp status, and the
          save-progress prompt. The current shell should not imply that a stamp has
          already been awarded.
        </Text>
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

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
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
    textAlign: 'center',
  },
  actions: {
    gap: theme.spacing.md,
  },
});
