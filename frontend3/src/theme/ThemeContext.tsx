import React, { createContext, useContext } from 'react';
import {
  lightColors,
  neoShadow as lightNeoShadow,
  neoShadowLg as lightNeoShadowLg,
} from './colors';

export type ThemeMode = 'light';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  colors: typeof lightColors;
  neoShadow: typeof lightNeoShadow;
  neoShadowLg: typeof lightNeoShadowLg;
  isDark: false;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  setMode: () => {},
  colors: lightColors,
  neoShadow: lightNeoShadow,
  neoShadowLg: lightNeoShadowLg,
  isDark: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider
      value={{
        mode: 'light',
        setMode: () => {},
        colors: lightColors,
        neoShadow: lightNeoShadow,
        neoShadowLg: lightNeoShadowLg,
        isDark: false,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

