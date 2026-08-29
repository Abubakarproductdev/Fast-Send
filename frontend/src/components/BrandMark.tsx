import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export function BrandMark({ compact = false }: { compact?: boolean }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return (
    <View style={[styles.wrap, compact && styles.compactWrap]}>
      <View style={[styles.icon, compact && styles.compactIcon]}>
        <Ionicons name="aperture-outline" size={compact ? 17 : 26} color="#FFFDF8" />
      </View>
      <Text style={[styles.wordmark, compact && styles.compactWordmark]}>FAST SEND</Text>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  compactWrap: { gap: 7 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: colors.sageDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactIcon: { width: 30, height: 30, borderRadius: 10 },
  wordmark: { fontSize: 16, fontWeight: '900', color: colors.textPrimary, letterSpacing: 2.2 },
  compactWordmark: { fontSize: 12, letterSpacing: 1.5 },
});
