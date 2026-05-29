import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { theme } from '../../styles/theme';

type SaveProgressPromptProps = {
  title?: string;
  body: string;
  onSaveProgress: () => void;
  onDismiss: () => void;
};

export function SaveProgressPrompt({
  title = 'Save your progress',
  body,
  onSaveProgress,
  onDismiss,
}: SaveProgressPromptProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.badge}>Guest reminder</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>

      <View style={styles.actions}>
        <Button onPress={onSaveProgress}>Save Progress</Button>
        <Button variant="secondary" onPress={onDismiss}>
          Maybe Later
        </Button>
      </View>
    </View>
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
  },
  body: {
    color: theme.colors.mutedText,
    fontSize: theme.typography.body,
    lineHeight: 24,
  },
  actions: {
    gap: theme.spacing.sm,
  },
});
