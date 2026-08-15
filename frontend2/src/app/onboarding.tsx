import React, { useEffect } from 'react';
import {
  Dimensions,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

const { width, height } = Dimensions.get('window');

const FEATURES = [
  { icon: 'qr-code' as const,        text: 'Share a QR code with guests' },
  { icon: 'cloud-upload' as const,   text: 'Push photos with one tap' },
  { icon: 'scan' as const,           text: 'AI delivers photos to each guest' },
];

export default function OnboardingScreen() {
  const router = useRouter();

  const heroOpacity  = useSharedValue(0);
  const heroScale    = useSharedValue(0.92);
  const copyOpacity  = useSharedValue(0);
  const copyTranslateY = useSharedValue(24);
  const btnOpacity   = useSharedValue(0);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ scale: heroScale.value }],
  }));

  const copyStyle = useAnimatedStyle(() => ({
    opacity: copyOpacity.value,
    transform: [{ translateY: copyTranslateY.value }],
  }));

  const btnStyle = useAnimatedStyle(() => ({
    opacity: btnOpacity.value,
  }));

  useEffect(() => {
    heroOpacity.value  = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    heroScale.value    = withSpring(1, { damping: 20, stiffness: 140 });
    copyOpacity.value  = withDelay(300, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
    copyTranslateY.value = withDelay(300, withSpring(0, { damping: 20, stiffness: 160 }));
    btnOpacity.value   = withDelay(600, withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Subtle top glow */}
      <LinearGradient
        colors={['rgba(196,241,53,0.05)', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Hero image — top half */}
      <Animated.View style={[styles.heroContainer, heroStyle]}>
        <Image
          source={require('../../assets/images/logo-glow.png')}
          style={styles.heroImage}
          resizeMode="contain"
          accessible={false}
        />
        {/* Dark fade overlay so image bleeds into dark bg */}
        <LinearGradient
          colors={['transparent', colors.bg]}
          start={{ x: 0.5, y: 0.4 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </Animated.View>

      {/* Copy block */}
      <Animated.View style={[styles.copyBlock, copyStyle]}>
        <Text style={styles.title}>
          Share Every{'\n'}
          <Text style={styles.titleAccent}>Moment</Text>
        </Text>
        <Text style={styles.subtitle}>
          Create a trip, share your QR code, and let AI deliver photos to every guest automatically.
        </Text>

        {/* Feature pills */}
        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.icon} style={styles.featurePill}>
              <Ionicons name={f.icon} size={14} color={colors.lime} />
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Dots indicator */}
      <View style={styles.dots}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>

      {/* Buttons */}
      <Animated.View style={[styles.buttons, btnStyle]}>
        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.primaryBtn}
          onPress={() => router.push('/register')}
        >
          <LinearGradient
            colors={['#C4F135', '#96C018']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primaryBtnGradient}
          >
            <Text style={styles.primaryBtnText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.textOnLime} style={{ marginLeft: 6 }} />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signInLink}
          onPress={() => router.push('/login')}
          activeOpacity={0.7}
        >
          <Text style={styles.signInText}>
            Already have an account?{' '}
            <Text style={styles.signInStrong}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  heroContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.48,
  },
  heroImage: {
    position: 'absolute',
    top: 32,
    left: width * 0.12,
    width: width * 0.76,
    height: height * 0.40,
  },
  copyBlock: {
    position: 'absolute',
    top: height * 0.44,
    left: spacing.lg,
    right: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.size.xxl,  // 32px
    fontFamily: typography.fontExtraBold,
    lineHeight: 38,
    letterSpacing: -1,
    marginBottom: spacing.md,
  },
  titleAccent: {
    color: colors.lime,
  },
  subtitle: {
    fontSize: typography.size.base,
    fontFamily: typography.fontRegular,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  features: {
    gap: spacing.sm,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bgCard,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  featureText: {
    fontSize: typography.size.sm,
    fontFamily: typography.fontMedium,
    color: colors.textSecondary,
  },
  dots: {
    position: 'absolute',
    // 56px button + 32px bottom padding + 8px gap + 16px sign-in link height ≈ 112px + some buffer
    bottom: spacing.xl + 56 + spacing.md + spacing.xl,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderStrong,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.lime,
  },
  buttons: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    gap: spacing.sm,
  },
  primaryBtn: {
    borderRadius: radius.pill,
    overflow: 'hidden',
    shadowColor: colors.lime,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 10,
  },
  primaryBtnGradient: {
    height: 56,
    borderRadius: radius.pill,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: colors.textOnLime,
    fontSize: typography.size.md,
    fontFamily: typography.fontBold,
    letterSpacing: 0.3,
  },
  signInLink: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  signInText: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    fontFamily: typography.fontRegular,
  },
  signInStrong: {
    color: colors.lime,
    fontFamily: typography.fontBold,
  },
});
