import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { theme } from '../../styles/theme';

export default function AccountScreen() {
  return (
    <Screen>
      <View style={styles.card}>
        <Text style={styles.title}>Account</Text>
        <Text style={styles.body}>
          Guest play and save-progress prompts will be added later. Phase 1 keeps this
          as a placeholder only.
        </Text>
      </View>

      <Button variant="secondary" onPress={() => router.push('/home')}>
        Back to Home
      </Button>
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
});
