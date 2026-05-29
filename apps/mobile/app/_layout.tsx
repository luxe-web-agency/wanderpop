import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppProvider } from '../src/providers/AppProvider';
import { theme } from '../src/styles/theme';

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: theme.colors.background },
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Welcome' }} />
        <Stack.Screen name="home" options={{ title: 'Home' }} />
        <Stack.Screen name="quiz" options={{ title: 'Quiz' }} />
        <Stack.Screen name="quiz-complete" options={{ title: 'Quiz Complete' }} />
        <Stack.Screen name="passport/index" options={{ title: 'Passport' }} />
        <Stack.Screen name="passport/[challengeId]" options={{ title: 'Stamp Detail' }} />
        <Stack.Screen name="account" options={{ title: 'Account' }} />
      </Stack>
    </AppProvider>
  );
}
