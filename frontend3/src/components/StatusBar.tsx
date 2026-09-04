import React from 'react';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { View, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const StatusBar: React.FC = () => {
  const insets = useSafeAreaInsets();
  return (
    <>
      <ExpoStatusBar style="dark" />
      <View style={{ height: Platform.OS === 'android' ? Math.max(insets.top, 8) : insets.top }} />
    </>
  );
};
