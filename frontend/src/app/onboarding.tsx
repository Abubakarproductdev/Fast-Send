import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Dimensions,
  ScrollView, TouchableOpacity, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { PrimaryButton } from '../components/PrimaryButton';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    icon: '📷',
    title: 'Start a Trip',
    subtitle: 'Create a trip in seconds and let our AI handle the rest.',
    accent: '#F59E0B',
  },
  {
    icon: '☁️',
    title: 'Auto-Push Photos',
    subtitle: 'We remind you to upload. One tap — all new photos are sent instantly.',
    accent: '#6366F1',
  },
  {
    icon: '📲',
    title: 'Share Instantly',
    subtitle: 'Guests scan the QR and get their personal photo gallery — delivered automatically.',
    accent: '#10B981',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, bounciness: 6, speed: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  const currentAccent = SLIDES[activeIndex].accent;

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.inner,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Logo */}
        <View style={styles.logoRow}>
          <Text style={styles.logoIcon}>📷</Text>
          <Text style={styles.logoText}>FastSend</Text>
        </View>

        {/* Slides */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          style={styles.scrollView}
        >
          {SLIDES.map((slide, index) => (
            <View key={index} style={styles.slide}>
              <View style={[styles.iconRing, { backgroundColor: slide.accent + '1A', borderColor: slide.accent + '44' }]}>
                <Text style={styles.icon}>{slide.icon}</Text>
              </View>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.subtitle}>{slide.subtitle}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Dots */}
        <View style={styles.dotsContainer}>
          {SLIDES.map((slide, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: activeIndex === index ? slide.accent : colors.border,
                  width: activeIndex === index ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <PrimaryButton
            title="Get Started"
            onPress={() => router.push('/register')}
          />
          <TouchableOpacity onPress={() => router.push('/login')} style={styles.linkButton}>
            <Text style={styles.linkText}>
              Already have an account?{' '}
              <Text style={styles.linkTextBold}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  logoIcon: { fontSize: 24 },
  logoText: {
    fontSize: typography.size.lg,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  scrollView: { flex: 1 },
  slide: {
    width: width - spacing.lg * 2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.lg,
  },
  iconRing: {
    width: 120,
    height: 120,
    borderRadius: 36,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: { fontSize: 56 },
  title: {
    fontSize: typography.size.xxl,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.size.base * typography.lineHeight.normal,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginVertical: spacing.lg,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  actions: {
    paddingBottom: spacing.xxl,
    gap: 0,
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  linkText: {
    color: colors.textSecondary,
    fontSize: typography.size.base,
  },
  linkTextBold: {
    fontWeight: '700',
    color: colors.amber,
  },
});
