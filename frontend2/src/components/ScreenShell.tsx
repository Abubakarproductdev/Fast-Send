import React from 'react';
import { View, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

interface ScreenShellProps {
  children: React.ReactNode;
  /** When true, renders a faint lime radial glow at the top — use on hero screens */
  glow?: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Full-screen dark shell with safe area handling.
 * Optional top glow to break up the flat obsidian background.
 */
export const ScreenShell = ({ children, glow = false }: ScreenShellProps) => (
  <SafeAreaView style={styles.safe}>
    {glow && (
      <LinearGradient
        colors={['rgba(196,241,53,0.05)', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.glow}
        pointerEvents="none"
      />
    )}
    <View style={styles.container}>{children}</View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.35,
    zIndex: 0,
  },
  container: {
    flex: 1,
    zIndex: 1,
  },
});
