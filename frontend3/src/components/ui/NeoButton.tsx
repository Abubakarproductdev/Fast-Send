import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface NeoButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const NeoButton: React.FC<NeoButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const { colors, neoShadow, neoShadowLg } = useTheme();

  const styles = StyleSheet.create({
    baseBtn: {
      borderRadius: 999,
      borderWidth: 2,
      borderColor: colors.ink,
      justifyContent: 'center',
      alignItems: 'center',
    },
    innerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrap: {
      marginRight: 8,
    },
    baseText: {
      fontFamily: 'Nunito_800ExtraBold',
      fontWeight: '800',
      textAlign: 'center',
    },
    primaryBtn: {
      backgroundColor: colors.brand,
    },
    primaryText: {
      color: colors.ink,
      fontSize: 16,
    },
    secondaryBtn: {
      backgroundColor: colors.white,
    },
    secondaryText: {
      color: colors.ink,
      fontSize: 15,
    },
    dangerBtn: {
      backgroundColor: colors.flame,
    },
    dangerText: {
      color: colors.cream,
      fontSize: 15,
    },
    ghostBtn: {
      backgroundColor: 'transparent',
      borderWidth: 0,
    },
    ghostText: {
      color: colors.ink,
      fontSize: 15,
    },
    smBtn: {
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    mdBtn: {
      paddingVertical: 12,
      paddingHorizontal: 20,
    },
    lgBtn: {
      paddingVertical: 14,
      paddingHorizontal: 24,
    },
    disabledBtn: {
      opacity: 0.55,
    },
  });

  const getVariantStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryBtn;
      case 'danger':
        return styles.dangerBtn;
      case 'ghost':
        return styles.ghostBtn;
      case 'primary':
      default:
        return styles.primaryBtn;
    }
  };

  const getVariantTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryText;
      case 'danger':
        return styles.dangerText;
      case 'ghost':
        return styles.ghostText;
      case 'primary':
      default:
        return styles.primaryText;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return styles.smBtn;
      case 'lg':
        return styles.lgBtn;
      case 'md':
      default:
        return styles.mdBtn;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.baseBtn,
        getVariantStyle(),
        getSizeStyle(),
        variant !== 'ghost' && (size === 'lg' ? neoShadowLg : neoShadow),
        disabled && styles.disabledBtn,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'danger' ? colors.cream : colors.ink}
        />
      ) : (
        <View style={styles.innerRow}>
          {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
          <Text style={[styles.baseText, getVariantTextStyle(), textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
