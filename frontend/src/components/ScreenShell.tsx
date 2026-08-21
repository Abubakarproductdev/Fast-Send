import React from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { colors } from '../theme/colors';

interface ScreenShellProps {
  children: React.ReactNode;
  noPadding?: boolean;
}

/**
 * Premium Full-screen shell with absolute black base and optional padding.
 */
export const ScreenShell = ({ children, noPadding = false }: ScreenShellProps) => (
  <View style={styles.root}>
    <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
    <SafeAreaView style={styles.safe}>
      <View style={[styles.container, !noPadding && styles.padding]}>
        {children}
      </View>
    </SafeAreaView>
  </View>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  padding: {
    paddingHorizontal: 20,
  },
});
