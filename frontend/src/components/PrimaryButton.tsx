import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { radius, spacing } from '../theme/spacing';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  type?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

export const PrimaryButton = ({
  title,
  onPress,
  fullWidth = true,
  loading = false,
  disabled = false,
  type = 'primary',
}: PrimaryButtonProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  const getStyle = () => {
    if (disabled) return styles.disabled;
    switch (type) {
      case 'secondary': return styles.secondary;
      case 'danger':    return styles.danger;
      case 'ghost':     return styles.ghost;
      default:          return styles.primary;
    }
  };

  const getTextStyle = () => {
    if (disabled) return styles.textDisabled;
    switch (type) {
      case 'secondary': return styles.textSecondary;
      case 'danger':    return styles.textWhite;
      case 'ghost':     return styles.textAmber;
      default:          return styles.textDark;
    }
  };

  return (
    <Animated.View
      style={[
        fullWidth && styles.fullWidth,
        { transform: [{ scale: scaleAnim }] },
        styles.wrapper,
      ]}
    >
      <TouchableOpacity
        style={[styles.button, getStyle()]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
      >
        {loading ? (
          <ActivityIndicator
            color={type === 'primary' ? colors.bg : colors.amber}
            size="small"
          />
        ) : (
          <Text style={[styles.text, getTextStyle()]}>{title}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  fullWidth: {
    width: '100%',
  },
  button: {
    height: 56,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  // variants
  primary: {
    backgroundColor: colors.amber,
    shadowColor: colors.amber,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  secondary: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  danger: {
    backgroundColor: colors.error,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  // text
  text: {
    fontSize: typography.size.md,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  textDark:     { color: colors.bg },
  textSecondary: { color: colors.textPrimary },
  textWhite:    { color: '#FFFFFF' },
  textAmber:    { color: colors.amber },
  textDisabled: { color: colors.textDisabled },
});
