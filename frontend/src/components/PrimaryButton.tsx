import React, { useRef } from 'react';
import {
  TouchableOpacity, Text, StyleSheet, ActivityIndicator, Animated, ViewStyle,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { radius, spacing } from '../theme/spacing';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  type?: 'primary' | 'secondary' | 'danger' | 'ghost';
  style?: ViewStyle;
}

export const PrimaryButton = ({
  title, onPress, fullWidth = true, loading = false, disabled = false, type = 'primary', style,
}: PrimaryButtonProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const press = (toValue: number) => Animated.spring(scaleAnim, {
    toValue, useNativeDriver: true, speed: 40, bounciness: 4,
  }).start();

  const buttonStyle = disabled ? styles.disabled : styles[type];
  const textStyle = disabled ? styles.textDisabled : styles[`${type}Text` as keyof typeof styles];

  return (
    <Animated.View style={[fullWidth && styles.fullWidth, styles.wrapper, { transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        style={[styles.button, buttonStyle]}
        onPress={onPress}
        onPressIn={() => press(0.975)}
        onPressOut={() => press(1)}
        disabled={disabled || loading}
        activeOpacity={0.9}
      >
        {loading ? <ActivityIndicator color={type === 'primary' ? '#FFFDF8' : colors.primary} size="small" /> : (
          <Text style={[styles.text, textStyle]}>{title}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  fullWidth: { width: '100%' },
  button: {
    minHeight: 56,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  primary: {
    backgroundColor: colors.primary,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 4,
  },
  secondary: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.borderStrong },
  danger: { backgroundColor: colors.error },
  ghost: { backgroundColor: 'transparent' },
  disabled: { backgroundColor: colors.bgElevated, opacity: 0.55 },
  text: { fontSize: typography.size.sm, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  primaryText: { color: '#FFFDF8' },
  secondaryText: { color: colors.textPrimary },
  dangerText: { color: '#FFFFFF' },
  ghostText: { color: colors.primaryDark },
  textDisabled: { color: colors.textMuted },
});
