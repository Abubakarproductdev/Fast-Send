import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { radius, spacing, shadows } from '../theme/spacing';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  type?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

const SPRING_PRESS = { damping: 15, stiffness: 400 };
const SPRING_RELEASE = { damping: 12, stiffness: 300 };

export const PrimaryButton = ({
  title,
  onPress,
  fullWidth = true,
  loading = false,
  disabled = false,
  type = 'primary',
}: PrimaryButtonProps) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, SPRING_PRESS);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SPRING_RELEASE);
  };

  const isDisabled = disabled || loading;

  const renderContent = () => {
    if (loading) {
      const spinnerColor =
        type === 'primary' ? colors.textOnLime :
        type === 'danger'  ? colors.white :
        colors.lime;
      return <ActivityIndicator color={spinnerColor} size="small" />;
    }
    return (
      <Text style={[styles.text, getTextStyle()]}>
        {title}
      </Text>
    );
  };

  const getTextStyle = () => {
    if (isDisabled) return styles.textDisabled;
    switch (type) {
      case 'secondary': return styles.textPrimary;
      case 'danger':    return styles.textWhite;
      case 'ghost':     return styles.textLime;
      default:          return styles.textOnLime;
    }
  };

  const renderButton = () => {
    if (type === 'primary' && !isDisabled) {
      return (
        <LinearGradient
          colors={[colors.lime, colors.limeDark]} // #C4F135 → #96C018
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.button}
        >
          {renderContent()}
        </LinearGradient>
      );
    }

    let buttonStyle;
    if (isDisabled) {
      buttonStyle = styles.buttonDisabled;
    } else {
      switch (type) {
        case 'secondary': buttonStyle = styles.buttonSecondary; break;
        case 'danger':    buttonStyle = styles.buttonDanger;    break;
        case 'ghost':     buttonStyle = styles.buttonGhost;     break;
        default:          buttonStyle = styles.buttonDisabled;  break;
      }
    }

    return (
      <View style={[styles.button, buttonStyle]}>
        {renderContent()}
      </View>
    );
  };

  const getShadow = () => {
    if (isDisabled || type !== 'primary') return {};
    return shadows.limeGlow;
  };

  const getDangerShadow = () => {
    if (isDisabled || type !== 'danger') return {};
    return {
      shadowColor: colors.error,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 8,
    };
  };

  return (
    <Animated.View
      style={[
        fullWidth && styles.fullWidth,
        styles.wrapper,
        animatedStyle,
        getShadow(),
        getDangerShadow(),
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={1}
        style={styles.touchable}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
      >
        {renderButton()}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  fullWidth: {
    width: '100%',
  },
  touchable: {
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  button: {
    height: 56,
    borderRadius: radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  buttonSecondary: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  buttonDanger: {
    backgroundColor: colors.error,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonDisabled: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    fontSize: typography.size.md,
    fontFamily: typography.fontBold,
    letterSpacing: 0.3,
  },
  textOnLime:   { color: colors.textOnLime },
  textPrimary:  { color: colors.textPrimary },
  textWhite:    { color: colors.white },
  textLime:     { color: colors.lime },
  textDisabled: { color: colors.textDisabled },
});
