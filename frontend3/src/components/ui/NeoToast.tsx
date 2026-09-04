import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

export const NeoToast: React.FC<{ msg: string | null }> = ({ msg }) => {
  if (!msg) return null;
  return (
    <View pointerEvents="none" style={styles.container}>
      <View style={styles.toast}>
        <Text style={styles.text}>{msg}</Text>
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
    borderColor: colors.ink,
    backgroundColor: colors.ink,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 0,
    elevation: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.cream,
    textAlign: 'center',
  },
});
