import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

interface ScreenShellProps {
  children: React.ReactNode;
  noPadding?: boolean;
}

export const ScreenShell = ({ children, noPadding = false }: ScreenShellProps) => {
  const { colors, isDark } = useTheme();
  const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    safe: { flex: 1 },
    container: { flex: 1 },
    // SafeAreaView supplies the device-specific inset for the status bar,
    // notch, or Dynamic Island. Keep only a small design gap on top.
    padding: { paddingHorizontal: 20, paddingTop: 4 },
  });
  return <View style={styles.root}>
    <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={[styles.container, !noPadding && styles.padding]}>{children}</View>
    </SafeAreaView>
  </View>;
};
