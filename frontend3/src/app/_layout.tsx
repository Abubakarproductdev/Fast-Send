import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';
import { TripModalProvider } from '../context/TripModalContext';
import { ThemeProvider, useTheme } from '../theme/ThemeContext';

SplashScreen.preventAutoHideAsync();

function AppStack() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.cream },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="trip-details" />
      <Stack.Screen name="legal" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <TripModalProvider>
            <View style={styles.appWrapper} onLayout={() => SplashScreen.hideAsync()}>
              <AppStack />
            </View>
          </TripModalProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  appWrapper: {
    flex: 1,
  },
});
