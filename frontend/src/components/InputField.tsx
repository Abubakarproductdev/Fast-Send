import React, { useRef } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { radius, spacing } from '../theme/spacing';

interface InputFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: string;
}

export const InputField = ({ label, error, icon, ...props }: InputFieldProps) => {
  const focusAnim = useRef(new Animated.Value(0)).current;
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const animateFocus = (value: number) => Animated.timing(focusAnim, {
    toValue: value, duration: 180, useNativeDriver: false,
  }).start();
  const borderColor = focusAnim.interpolate({ inputRange: [0, 1], outputRange: [colors.border, colors.primary] });
  const backgroundColor = focusAnim.interpolate({ inputRange: [0, 1], outputRange: [colors.paper, '#FFF8F3'] });

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Animated.View style={[styles.inputWrapper, { borderColor, backgroundColor }, error && styles.inputWrapperError]}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.textMuted}
          onFocus={() => animateFocus(1)}
          onBlur={() => animateFocus(0)}
          selectionColor={colors.primary}
          {...props}
        />
      </Animated.View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: { marginBottom: spacing.lg, width: '100%' },
  label: { fontSize: typography.size.xs, color: colors.textSecondary, marginBottom: spacing.sm, fontWeight: '800', letterSpacing: 1.1, textTransform: 'uppercase' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, minHeight: 58 },
  inputWrapperError: { borderColor: colors.error },
  icon: { fontSize: 18, marginRight: spacing.sm },
  input: { flex: 1, fontSize: typography.size.base, color: colors.textPrimary, fontWeight: '500', paddingVertical: 0 },
  errorText: { marginTop: spacing.xs, paddingLeft: spacing.xs, fontSize: typography.size.xs, color: colors.error, fontWeight: '700' },
});
