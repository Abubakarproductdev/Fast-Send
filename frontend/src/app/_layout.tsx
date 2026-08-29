import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold, Inter_900Black } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Text, TextInput } from 'react-native';

SplashScreen.preventAutoHideAsync();

// Apply Inter as the default font across the entire app
const defaultFontFamily = 'Inter_400Regular';
const originalTextRender = (Text as any).render;
if (!(Text as any)._fontPatched) {
  (Text as any)._fontPatched = true;
  const OldText = Text as any;
  // We apply font via defaultProps instead to avoid render override issues
}

// Set default font on Text and TextInput
(Text as any).defaultProps = (Text as any).defaultProps || {};
(Text as any).defaultProps.style = [{ fontFamily: 'Inter_400Regular' }, (Text as any).defaultProps?.style];
(TextInput as any).defaultProps = (TextInput as any).defaultProps || {};
(TextInput as any).defaultProps.style = [{ fontFamily: 'Inter_400Regular' }, (TextInput as any).defaultProps?.style];

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
        <Stack.Screen name="legal" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return <SafeAreaProvider><ThemeProvider><AuthProvider><AppStack /></AuthProvider></ThemeProvider></SafeAreaProvider>;
}
