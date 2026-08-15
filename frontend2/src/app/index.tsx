import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useAuth } from '../context/AuthContext';

export default function SplashScreen() {
  const router = useRouter();
  const { isLoading, user, organizerId } = useAuth();

  const logoScale   = useSharedValue(0.6);
  const logoOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  useEffect(() => {
    logoScale.value = withSpring(1, { damping: 14, stiffness: 120, mass: 0.8 });
    logoOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    titleOpacity.value = withDelay(200, withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }));
    taglineOpacity.value = withDelay(450, withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }));
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const timeout = setTimeout(() => {
        if (user && organizerId) {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding');
        }
      }, 1400);
      return () => clearTimeout(timeout);
    }
  }, [isLoading, user, organizerId]);

  return (
    <View style={styles.container}>
      {/* Subtle lime glow at top */}
      <LinearGradient
        colors={['rgba(196,241,53,0.06)', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
        style={styles.glow}
        pointerEvents="none"
      />

      <Animated.View style={[styles.logoRing, logoStyle]}>
        <LinearGradient
          colors={['rgba(196,241,53,0.18)', 'rgba(196,241,53,0.06)']}
          style={styles.logoGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Ionicons name="camera" size={42} color={colors.lime} />
      </Animated.View>

      <Animated.View style={titleStyle}>
        <Text style={styles.title}>FastSend</Text>
      </Animated.View>

      <Animated.View style={taglineStyle}>
        <Text style={styles.tagline}>Your moments, delivered instantly.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  logoRing: {
    width: 100,
    height: 100,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: 'rgba(196,241,53,0.30)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  logoGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  title: {
    fontSize: typography.size.hero,
    fontFamily: typography.fontExtraBold,
    color: colors.textPrimary,
    letterSpacing: -1.5,
  },
  tagline: {
    fontSize: typography.size.base,  // 15px — close to 16; use base token
    fontFamily: typography.fontRegular,
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
});
