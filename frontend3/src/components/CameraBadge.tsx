import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';

export const CameraBadge: React.FC<{ size?: number }> = ({ size = 64 }) => {
  const { neoShadowLg } = useTheme();
  const iconSize = size * 0.55;

  return (
    <View
      style={[
        styles.badge,
        neoShadowLg,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.31),
        },
      ]}
    >
      <Svg viewBox="0 0 40 40" width={iconSize} height={iconSize}>
        <Path
          d="M14 9h12l3 5h5a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V18a4 4 0 0 1 4-4h5l3-5z"
          fill="#101010"
        />
        <Circle cx="20" cy="23" r="7" fill="#F6C500" />
        <Circle cx="20" cy="23" r="3" fill="#101010" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#F6C500',
    borderWidth: 2,
    borderColor: '#101010',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
