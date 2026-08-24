import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, StatusBar } from 'react-native';
import { darkColors, lightColors, ThemeColors } from '../theme/colors';

export type ThemeMode = 'light' | 'dark';
const THEME_MODE_KEY = '@fastsend_theme_mode';

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  colors: lightColors,
  isDark: false,
  setMode: async () => {},
  toggleTheme: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    AsyncStorage.getItem(THEME_MODE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark') setModeState(stored);
    }).catch(() => {});
  }, []);

  const setMode = async (nextMode: ThemeMode) => {
    setModeState(nextMode);
    await AsyncStorage.setItem(THEME_MODE_KEY, nextMode);
  };

  const value = useMemo(() => ({
    mode,
    colors: mode === 'dark' ? darkColors : lightColors,
    isDark: mode === 'dark',
    setMode,
    toggleTheme: () => setMode(mode === 'dark' ? 'light' : 'dark'),
  }), [mode]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      StatusBar.setBarStyle(mode === 'dark' ? 'light-content' : 'dark-content');
    }
  }, [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
