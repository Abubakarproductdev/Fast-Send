import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Camera, QrCode, ArrowRight } from 'lucide-react-native';
import { CameraBadge } from '../components/CameraBadge';
import { StatusBar } from '../components/StatusBar';
import { NeoButton } from '../components/ui/NeoButton';
import { colors, neoShadowLg, neoShadow } from '../theme/colors';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    icon: Plus,
    solidBg: colors.flame,
    softBg: colors.flameSoft,
    eyebrow: 'Before your trip',
    title: 'Create a trip\nbefore you go.',
    subtitle: 'Open Fast Send, tap "Create a trip", give it a name — and you\'re done. Takes 10 seconds.',
  },
  {
    icon: Camera,
    solidBg: colors.leaf,
    softBg: colors.leafSoft,
    eyebrow: 'During your trip',
    title: 'Just enjoy\nthe moment.',
    subtitle: 'Take photos like you normally would. Fast Send runs in the background. No extra steps.',
  },
  {
    icon: QrCode,
    solidBg: colors.sky,
    softBg: colors.skySoft,
    eyebrow: 'After your trip',
    title: 'Everyone gets\ntheir photos.',
    subtitle: 'Show your QR code. Anyone who scans it gets their photos delivered straight to them.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    if (slideIndex !== activeIndex && slideIndex >= 0 && slideIndex < SLIDES.length) {
      setActiveIndex(slideIndex);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <CameraBadge size={34} />
          <Text style={styles.brandText}>FAST SEND</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/register')}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>SKIP</Text>
        </TouchableOpacity>
      </View>

      {/* Slide Carousel */}
      <FlatList
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.eyebrow}
        style={styles.carousel}
        renderItem={({ item }) => {
          const IconComponent = item.icon;
          return (
            <View style={styles.slideWrapper}>
              <View style={[styles.card, { backgroundColor: item.softBg }, neoShadowLg]}>
                <View style={styles.cardTop}>
                  <Text style={styles.eyebrowText}>{item.eyebrow}</Text>
                  <View style={[styles.iconBox, { backgroundColor: item.solidBg }, neoShadow]}>
                    <IconComponent size={20} strokeWidth={2.6} color={colors.cream} />
                  </View>
                </View>
                <Text style={styles.titleText}>{item.title}</Text>
                <Text style={styles.subtitleText}>{item.subtitle}</Text>
              </View>
            </View>
          );
        }}
      />

      {/* Bottom Area */}
      <View style={styles.bottomArea}>
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                activeIndex === i ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        <NeoButton
          title="Create a free account"
          onPress={() => router.push('/register')}
          size="lg"
          icon={<ArrowRight size={16} strokeWidth={3} color={colors.ink} />}
        />

        <TouchableOpacity
          onPress={() => router.push('/login')}
          style={styles.signInLink}
          activeOpacity={0.7}
        >
          <Text style={styles.signInText}>
            Already have an account?{' '}
            <Text style={styles.signInHighlight}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    marginBottom: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
    color: colors.ink,
  },
  skipText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
    color: colors.mut,
  },
  carousel: {
    flex: 1,
  },
  slideWrapper: {
    width,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.ink,
    padding: 22,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  eyebrowText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    color: 'rgba(16, 16, 16, 0.65)',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '6deg' }],
  },
  titleText: {
    fontSize: 27,
    fontWeight: '900',
    lineHeight: 32,
    color: colors.ink,
    marginBottom: 12,
  },
  subtitleText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    color: 'rgba(16, 16, 16, 0.65)',
  },
  bottomArea: {
    paddingHorizontal: 16,
    paddingBottom: 34,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 18,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.ink,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.brand,
  },
  dotInactive: {
    width: 8,
    backgroundColor: colors.creamDeep,
  },
  signInLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  signInText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(16, 16, 16, 0.65)',
  },
  signInHighlight: {
    fontWeight: '900',
    color: colors.flame,
  },
});
