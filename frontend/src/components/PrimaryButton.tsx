import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  ViewStyle,
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
  style?: ViewStyle;
}

export const PrimaryButton = ({
  title,
  onPress,
  fullWidth = true,
  loading = false,
  disabled = false,
  type = 'primary',
  style,
}: PrimaryButtonProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const getButtonStyle = () => {
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
      case 'ghost':     return styles.textPrimaryColor;
      default:          return styles.textDark;
    }
  };

  return (
    <Animated.View
      style={[
        fullWidth && styles.fullWidth,
        { transform: [{ scale: scaleAnim }] },
        styles.wrapper,
        style,
      ]}
    >
      <TouchableOpacity
        style={[styles.button, getButtonStyle()]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
      >
        {loading ? (
          <ActivityIndicator
            color={type === 'primary' ? colors.bg : colors.primary}
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
    height: 58,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  // Variants
  primary: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  secondary: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  danger: {
    backgroundColor: colors.error,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    backgroundColor: colors.bgElevated,
    opacity: 0.5,
  },
  // Text
  text: {
    fontSize: typography.size.base,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  textDark: { color: colors.bg },
  textSecondary: { color: colors.textPrimary },
  textWhite: { color: '#FFFFFF' },
  textPrimaryColor: { color: colors.primary },
  textDisabled: { color: colors.textMuted },
});
