import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export const NeoField: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    field: {
      marginBottom: 16,
    },
    label: {
      fontFamily: 'Nunito_800ExtraBold',
      fontSize: 13,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      color: colors.mut,
      marginBottom: 6,
    },
  });

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
};
