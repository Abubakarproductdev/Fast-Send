import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { radius, spacing } from '../theme/spacing';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  type?: 'primary' | 'secondary' | 'danger';
}

export const PrimaryButton = ({ 
  title, 
  onPress, 
  fullWidth = true, 
  loading = false, 
  disabled = false,
  type = 'primary'
}: PrimaryButtonProps) => {
  
  const getBackgroundColor = () => {
    if (disabled) return colors.divider;
    if (type === 'secondary') return colors.white;
    if (type === 'danger') return colors.error;
    return colors.yellow;
  };

  const getTextColor = () => {
    if (disabled) return colors.textDisabled;
    if (type === 'secondary') return colors.textPrimary;
    if (type === 'danger') return colors.white;
    return colors.textPrimary;
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        fullWidth && styles.fullWidth,
        type === 'secondary' && styles.secondaryBorder
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  fullWidth: {
    width: '100%',
  },
  secondaryBorder: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  text: {
    fontSize: typography.size.md,
    fontWeight: 'bold',
  }
});
