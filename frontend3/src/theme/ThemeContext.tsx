import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  lightColors,
  darkColors,
  neoShadow as lightNeoShadow,
  neoShadowLg as lightNeoShadowLg,
  darkNeoShadow,
  darkNeoShadowLg,
} from './colors';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  colors: typeof lightColors;
  neoShadow: typeof lightNeoShadow;
  neoShadowLg: typeof lightNeoShadowLg;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'system',
  setMode: () => {},
  colors: lightColors,
  neoShadow: lightNeoShadow,
  neoShadowLg: lightNeoShadowLg,
  isDark: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('theme_mode').then((val) => {
      if (val === 'light' || val === 'dark' || val === 'system') {
        setModeState(val);
      }
      setMounted(true);
    });
  }, []);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem('theme_mode', newMode);
  };

  const isDark =
    mode === 'dark' || (mode === 'system' && systemScheme === 'dark');

  if (!mounted) return null; // Avoid flicker

  return (
    <ThemeContext.Provider
      value={{
        mode,
        setMode,
        colors: isDark ? darkColors : lightColors,
        neoShadow: isDark ? darkNeoShadow : lightNeoShadow,
        neoShadowLg: isDark ? darkNeoShadowLg : lightNeoShadowLg,
        isDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
