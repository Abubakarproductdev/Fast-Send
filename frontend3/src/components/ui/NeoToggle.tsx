import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

export const NeoToggle: React.FC<{
  on: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}> = ({ on, onChange }) => (
  <TouchableOpacity
    onPress={() => onChange(!on)}
    activeOpacity={0.8}
    style={[
      styles.track,
      { backgroundColor: on ? colors.leaf : colors.creamDeep },
    ]}
  >
    <View
      style={[
        styles.knob,
        { left: on ? 22 : 2 },
      ]}
    />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  track: {
    width: 48,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.ink,
    justifyContent: 'center',
    position: 'relative',
  },
  knob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    position: 'absolute',
  },
});
