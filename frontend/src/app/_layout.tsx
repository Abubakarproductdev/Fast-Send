import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function AppStack() {
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} translucent backgroundColor="transparent" />
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
        <Stack.Screen name="trip-details" />
        <Stack.Screen name="trip-settings" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return <SafeAreaProvider><ThemeProvider><AuthProvider><AppStack /></AuthProvider></ThemeProvider></SafeAreaProvider>;
}
