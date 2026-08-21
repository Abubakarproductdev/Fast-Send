import React, { useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  Animated,
} from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { radius, spacing } from '../theme/spacing';

interface InputFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: string;
}

export const InputField = ({ label, error, icon, ...props }: InputFieldProps) => {
  const borderAnim = useRef(new Animated.Value(0)).current;

  const onFocus = () => {
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  const onBlur = () => {
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.borderStrong, colors.primary],
  });

  const backgroundColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.bgCard, colors.bgElevated],
  });

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Animated.View 
        style={[
          styles.inputWrapper, 
          { borderColor, backgroundColor }, 
          error && styles.inputWrapperError
        ]}
      >
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.textMuted}
          onFocus={onFocus}
          onBlur={onBlur}
          selectionColor={colors.primary}
          {...props}
        />
      </Animated.View>
      {error && (
        <View style={styles.errorRow}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
    width: '100%',
  },
  label: {
    fontSize: typography.size.xs,
    color: colors.textGold,
    marginBottom: spacing.sm,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    height: 62,
  },
  inputWrapperError: {
    borderColor: colors.error,
  },
  icon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: typography.size.base,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  errorRow: {
    marginTop: spacing.xs,
    paddingLeft: spacing.xs,
  },
  errorText: {
    fontSize: typography.size.xs,
    color: colors.error,
    fontWeight: '600',
  },
});
