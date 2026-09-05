import React from 'react';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { View, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

export const StatusBar: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  
  return (
    <>
      <ExpoStatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ height: Platform.OS === 'android' ? Math.max(insets.top, 8) : insets.top }} />
    </>
  );
};
