import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0F172A' },
          animation: 'fade_from_bottom',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="trip/create" options={{ presentation: 'modal' }} />
        <Stack.Screen name="join" options={{ presentation: 'modal' }} />
        <Stack.Screen name="trip/[id]/index" />
        <Stack.Screen name="trip/[id]/register" />
        <Stack.Screen name="trip/[id]/gallery/[attendee_id]" />
      </Stack>
    </ThemeProvider>
  );
}
