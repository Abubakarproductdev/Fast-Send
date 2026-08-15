import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { radius, spacing } from '../theme/spacing';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface InputFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  /** Ionicons icon name, e.g. "mail-outline", "lock-closed-outline" */
  iconName?: IoniconName;
  /** @deprecated Use iconName instead. Legacy emoji string — will be ignored. */
  icon?: string;
}

export const InputField = ({ label, error, iconName, icon: _ignored, ...props }: InputFieldProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useSharedValue(0);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    focusAnim.value = withTiming(1, { duration: 200 });
    if (props.onFocus) props.onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    focusAnim.value = withTiming(0, { duration: 200 });
    if (props.onBlur) props.onBlur(e);
  };

  const animatedWrapperStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      focusAnim.value,
      [0, 1],
      [error ? colors.error : colors.border, error ? colors.error : colors.borderFocus],
    );
    const backgroundColor = interpolateColor(
      focusAnim.value,
      [0, 1],
      [colors.bgElevated, colors.bgOverlay],
    );
    return { borderColor, backgroundColor };
  });

  const iconColor = isFocused ? colors.lime : error ? colors.error : colors.textMuted;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      <Animated.View
        style={[
          styles.inputWrapper,
          animatedWrapperStyle,
          error && styles.inputWrapperError,
        ]}
      >
        {iconName && (
          <Ionicons
            name={iconName}
            size={18}
            color={iconColor}
            style={styles.icon}
          />
        )}
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.textMuted}
          cursorColor={colors.lime}
          selectionColor={colors.limeGlow}
          onFocus={handleFocus}
          onBlur={handleBlur}
          accessibilityLabel={label}
          accessibilityHint={props.placeholder}
          {...props}
        />
      </Animated.View>
      {error && (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={13} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    width: '100%',
  },
  label: {
    fontSize: typography.size.xs,
    fontFamily: typography.fontBold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 56,
  },
  inputWrapperError: {
    borderColor: colors.error,
    backgroundColor: 'rgba(244,63,94,0.06)',
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.size.base,
    fontFamily: typography.fontRegular,
    color: colors.textPrimary,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 5,
  },
  errorText: {
    fontSize: typography.size.xs,
    fontFamily: typography.fontMedium,
    color: colors.error,
  },
});
