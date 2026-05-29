import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { theme } from '../../styles/theme';

export default function HomeScreen() {
  return (
    <Screen>
      <View style={styles.card}>
        <Text style={styles.label}>Today&apos;s city</Text>
        <Text style={styles.title}>Placeholder City</Text>
        <Text style={styles.body}>
          This will show the backend-controlled daily city once Supabase is added in a
          later phase.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button onPress={() => router.push('/quiz' as never)}>Start Quiz</Button>
        <Button variant="secondary" onPress={() => router.push('/passport' as never)}>
          View Passport
        </Button>
        <Button variant="secondary" onPress={() => router.push('/account' as never)}>
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
  body: {
    color: theme.colors.mutedText,
    fontSize: theme.typography.body,
    lineHeight: 24,
  },
  actions: {
    gap: theme.spacing.md,
  },
});
