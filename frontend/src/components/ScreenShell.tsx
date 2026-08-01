import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { colors } from '../theme/colors';

interface ScreenShellProps {
  children: React.ReactNode;
}

/**
 * Full-screen dark shell with safe area handling.
 * Replaces HalfHalfLayout — all screens now use a unified dark canvas.
 */
export const ScreenShell = ({ children }: ScreenShellProps) => (
  <SafeAreaView style={styles.safe}>
    <View style={styles.container}>{children}</View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
