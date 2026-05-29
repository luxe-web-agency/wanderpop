import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useAppSession } from '../../providers/AppProvider';
import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { theme } from '../../styles/theme';

export default function AccountScreen() {
  const { session } = useAppSession();

  return (
    <Screen>
      <View style={styles.card}>
        <Text style={styles.title}>Account</Text>
        <Text style={styles.body}>
          You are currently using a guest session. Save-progress sign-in and merge flows
          are intentionally not wired up yet, but this session confirms the guest
          bootstrap is working.
        </Text>
        <View style={styles.metaGroup}>
          <Text style={styles.metaLabel}>Account type</Text>
          <Text style={styles.metaValue}>{session.accountType}</Text>
        </View>
        <View style={styles.metaGroup}>
          <Text style={styles.metaLabel}>Guest user ID</Text>
          <Text selectable style={styles.metaValue}>
            {session.userId}
          </Text>
        </View>
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
});
