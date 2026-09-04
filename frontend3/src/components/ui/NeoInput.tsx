import React, { useState } from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { colors } from '../../theme/colors';

export const NeoInput: React.FC<TextInputProps> = ({
  style,
  placeholderTextColor = 'rgba(139, 139, 139, 0.7)',
  ...props
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      style={[
        styles.input,
        focused && styles.inputFocused,
        style,
      ]}
      onFocus={(e) => {
        setFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        props.onBlur?.(e);
      }}
      placeholderTextColor={placeholderTextColor}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  inputFocused: {
    backgroundColor: 'rgba(246, 197, 0, 0.1)',
  },
});
