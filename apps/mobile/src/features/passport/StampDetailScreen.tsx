import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { theme } from '../../styles/theme';

export default function StampDetailScreen() {
  const { challengeId } = useLocalSearchParams<{ challengeId: string }>();

  return (
    <Screen>
      <View style={styles.card}>
        <Text style={styles.stamp}>◎</Text>
        <Text style={styles.title}>Stamp Detail</Text>
        <Text style={styles.body}>
          Challenge ID: {challengeId ?? 'placeholder-id'}
        </Text>
        <Text style={styles.body}>
          Later, this route will show city name, stamp status, score, total questions,
          and collection date.
        </Text>
      </View>

      <Button variant="secondary" onPress={() => router.back()}>
        Back to Passport
      </Button>
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
    textAlign: 'center',
  },
});
