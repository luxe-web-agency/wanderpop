import { APP_NAME, type AppEnvironment } from '@wanderpop/shared';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { theme } from '../../styles/theme';

const environment: AppEnvironment = 'development';

export default function WelcomeScreen() {
  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Daily travel trivia</Text>
        <Text style={styles.title}>{APP_NAME}</Text>
        <Text style={styles.body}>
          Discover one city each day, answer a quick quiz, and collect stamps in your
          seasonal passport.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button onPress={() => router.push('/home' as never)}>Go to Home</Button>
        <Text style={styles.meta}>Phase 1 placeholder · {environment}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    flex: 1,
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  eyebrow: {
    color: theme.colors.primaryDark,
    fontSize: theme.typography.small,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.title,
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
  meta: {
    color: theme.colors.mutedText,
    fontSize: theme.typography.small,
    textAlign: 'center',
  },
});
