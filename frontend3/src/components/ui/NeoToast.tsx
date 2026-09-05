import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export const NeoToast: React.FC<{ msg: string | null }> = ({ msg }) => {
  const { colors } = useTheme();
  if (!msg) return null;

  return (
    <View pointerEvents="none" style={styles.container}>
      <View style={[styles.toast, { borderColor: colors.ink, backgroundColor: colors.ink }]}>
        <Text style={[styles.text, { color: colors.cream }]}>{msg}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 90,
    zIndex: 999,
    alignItems: 'center',
  },
  toast: {
    borderRadius: 999,
    borderWidth: 2,
    paddingHorizontal: 18,
    paddingVertical: 11,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 0,
    elevation: 4,
  },
  text: {
    fontSize: 13,
    fontFamily: 'Nunito_800ExtraBold',
    fontWeight: '800',
    textAlign: 'center',
  },
});
