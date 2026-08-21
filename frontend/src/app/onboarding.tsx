import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Dimensions,
  ScrollView, TouchableOpacity, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenShell } from '../components/ScreenShell';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    icon: '✨',
    title: 'Experience\nElegance',
    subtitle: 'Fast Send is the premium way to capture and share trip memories.',
  },
  {
    icon: '📸',
    title: 'Intelligent\nCapture',
    subtitle: 'Our AI identifies every guest, delivering photos to the right hands.',
  },
  {
    icon: '🌟',
    title: 'Instant\nConnection',
    subtitle: 'Scan, join, and relive the journey in high-definition quality.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, bounciness: 4, speed: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  return (
    <ScreenShell noPadding>
      <Animated.View
        style={[
          styles.inner,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Header Logo */}
        <View style={styles.header}>
          <Text style={styles.logoText}>FAST SEND</Text>
          <View style={styles.logoDot} />
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
              <View style={styles.iconContainer}>
                <Text style={styles.iconText}>{slide.icon}</Text>
                <View style={styles.iconGlow} />
              </View>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.subtitle}>{slide.subtitle}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Navigation Area */}
        <View style={styles.navArea}>
          {/* Page Indicators */}
          <View style={styles.dotsContainer}>
            {SLIDES.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  activeIndex === index && styles.dotActive,
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
            <TouchableOpacity 
              onPress={() => router.push('/login')} 
              style={styles.linkButton}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>
                Already a member? <Text style={styles.linkTextGold}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  inner: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 4,
  },
  logoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  scrollView: { 
    flex: 1,
  },
  slide: {
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  iconText: {
    fontSize: 72,
    zIndex: 2,
  },
  iconGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryGlow,
    zIndex: 1,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -1,
    lineHeight: 48,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
  },
  navArea: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderStrong,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
  actions: {
    gap: 16,
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  linkText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  linkTextGold: {
    color: colors.primary,
    fontWeight: '700',
  },
});
