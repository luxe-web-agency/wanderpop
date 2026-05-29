import { ANALYTICS_EVENTS } from '@wanderpop/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { useAppSession } from '../../providers/AppProvider';
import { Button } from '../../components/Button';
import { Screen } from '../../components/Screen';
import { trackAnalyticsEvent } from '../../services/analytics';
import { startEmailMagicLink } from '../../services/auth';
import { theme } from '../../styles/theme';

export default function AccountScreen() {
  const { session } = useAppSession();
  const params = useLocalSearchParams<{ trigger?: string | string[] }>();
  const signupTrigger = Array.isArray(params.trigger) ? params.trigger[0] : params.trigger;
  const [email, setEmail] = useState(session.email ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isRegistered = !session.isGuest;

  async function handleSendMagicLink() {
    const normalizedEmail = email.trim();

    setError(null);
    setNotice(null);
    setIsSubmitting(true);

    try {
      if (normalizedEmail) {
        trackAnalyticsEvent(ANALYTICS_EVENTS.SIGNUP_STARTED, {
          method: 'email_magic_link',
          trigger:
            signupTrigger === 'save_progress_prompt'
              ? 'save_progress_prompt'
              : 'manual_account_open',
        });
      }

      await startEmailMagicLink(email);
      setNotice(
        'Magic link sent. Check your email and open the link on this device to finish saving your progress.',
      );
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : 'Unable to send a magic link right now. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen>
      <View style={styles.card}>
        <Text style={styles.title}>Account</Text>
        {isRegistered ? (
          <Text style={styles.body}>
            Your progress is now attached to an email-based sign-in session on this device.
          </Text>
        ) : (
          <Text style={styles.body}>
            You are currently using a guest session. Add an email magic link so this device
            can restore your saved progress more reliably later.
          </Text>
        )}
        <View style={styles.metaGroup}>
          <Text style={styles.metaLabel}>Account type</Text>
          <Text style={styles.metaValue}>
            {isRegistered ? 'email-linked session' : session.accountType}
          </Text>
        </View>
        <View style={styles.metaGroup}>
          <Text style={styles.metaLabel}>User ID</Text>
          <Text selectable style={styles.metaValue}>
            {session.userId}
          </Text>
        </View>

        {session.email ? (
          <View style={styles.metaGroup}>
            <Text style={styles.metaLabel}>Email</Text>
            <Text style={styles.metaValue}>{session.email}</Text>
          </View>
        ) : null}
      </View>

      {isRegistered ? (
        <View style={styles.card}>
          <Text style={styles.metaLabel}>What&apos;s next</Text>
          <Text style={styles.body}>
            Google sign-in, Apple sign-in, and deeper guest-progress merge handling can be
            layered on top of this later without blocking guest play today.
          </Text>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.metaLabel}>Save Progress</Text>
          <Text style={styles.body}>
            Enter your email and we&apos;ll send a magic link back to this app. Supabase
            must allow the redirect URL `wanderpop://auth/callback` for this to work.
          </Text>

          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={theme.colors.mutedText}
            style={styles.input}
            value={email}
          />

          {notice ? <Text style={styles.successText}>{notice}</Text> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Button disabled={isSubmitting} onPress={() => void handleSendMagicLink()}>
            {isSubmitting ? 'Sending Magic Link...' : 'Email Me A Magic Link'}
          </Button>

          <Text style={styles.footnote}>
            Guest-progress merge will be improved in a later phase. Google and Apple sign-in
            are also planned, but not part of this step.
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        <Button variant="secondary" onPress={() => router.push('/home')}>
          Back to Home
        </Button>
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
  input: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    color: theme.colors.text,
    fontSize: theme.typography.body,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  successText: {
    color: theme.colors.secondary,
    fontSize: theme.typography.small,
    fontWeight: '600',
  },
  errorText: {
    color: theme.colors.primaryDark,
    fontSize: theme.typography.small,
    fontWeight: '600',
  },
  footnote: {
    color: theme.colors.mutedText,
    fontSize: theme.typography.small,
    lineHeight: 20,
  },
  actions: {
    gap: theme.spacing.md,
  },
});
