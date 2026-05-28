import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { theme } from '../../styles/theme';

export default function QuizScreen() {
  return (
    <Screen>
      <View style={styles.card}>
        <Text style={styles.step}>Question 1 of 7</Text>
        <Text style={styles.title}>Which landmark will appear here?</Text>
        <Text style={styles.body}>
          Real quiz questions, answer locking, scoring, and feedback arrive in later
          phases.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button variant="secondary" onPress={() => {}}>
          Placeholder Option A
        </Button>
        <Button variant="secondary" onPress={() => {}}>
          Placeholder Option B
        </Button>
        <Button onPress={() => router.push('/quiz-complete')}>Complete Placeholder Quiz</Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  step: {
    color: theme.colors.secondary,
    fontSize: theme.typography.small,
    fontWeight: '700',
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
  actions: {
    gap: theme.spacing.md,
  },
});
