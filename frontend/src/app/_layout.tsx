import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../context/AuthContext';
import { colors } from '../theme/colors';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="create-trip" />
        <Stack.Screen name="active-trip" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </AuthProvider>
  );
}
