import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../theme/colors';
import { spacing, radius } from '../theme/spacing';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenShell } from '../components/ScreenShell';
import { BrandMark } from '../components/BrandMark';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
const SLIDES = [
  { icon: 'images-outline' as const, eyebrow: '01 / COLLECT', title: 'Every moment,\nin one place.', subtitle: 'Fast Send turns a live event into a beautifully organized memory vault.' },
  { icon: 'sparkles-outline' as const, eyebrow: '02 / MATCH', title: 'The right photos\nfind the right people.', subtitle: 'Our AI quietly recognizes guests so the gallery feels personal from the start.' },
  { icon: 'qr-code-outline' as const, eyebrow: '03 / SHARE', title: 'Share the moment\nwhile it is happening.', subtitle: 'Create a trip, show one code, and let every guest step into the story.' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, bounciness: 4, speed: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleScroll = (event: any) => setActiveIndex(Math.round(event.nativeEvent.contentOffset.x / width));

  return (
    <ScreenShell noPadding>
      <Animated.View style={[styles.inner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.header}>
          <BrandMark />
          <TouchableOpacity onPress={() => router.push('/register')}><Text style={styles.skip}>SKIP</Text></TouchableOpacity>
        </View>
        <Animated.ScrollView 
          horizontal 
          pagingEnabled 
          showsHorizontalScrollIndicator={false} 
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollView}
        >
          {SLIDES.map((slide, index) => {
            const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
            
            const iconScale = scrollX.interpolate({ inputRange, outputRange: [0.6, 1, 0.6], extrapolate: 'clamp' });
            const iconRotate = scrollX.interpolate({ inputRange, outputRange: ['15deg', '-8deg', '-30deg'], extrapolate: 'clamp' });
            const orbTranslate = scrollX.interpolate({ inputRange, outputRange: [-100, 0, 100], extrapolate: 'clamp' });
            const textTranslate = scrollX.interpolate({ inputRange, outputRange: [40, 0, -40], extrapolate: 'clamp' });
            const textOpacity = scrollX.interpolate({ inputRange, outputRange: [0, 1, 0], extrapolate: 'clamp' });

            return (
              <View key={slide.eyebrow} style={styles.slide}>
                <View style={styles.artCard}>
                  <View style={styles.artTopRow}>
                    <Text style={styles.artEyebrow}>{slide.eyebrow}</Text>
                    <Text style={styles.artNumber}>0{index + 1}</Text>
                  </View>
                  <View style={styles.artCenter}>
                    <Animated.View style={[styles.artOrb, { transform: [{ translateX: orbTranslate }] }]} />
                    <Animated.View style={[styles.iconTile, { transform: [{ scale: iconScale }, { rotate: iconRotate }] }]}>
                      <Ionicons name={slide.icon} size={42} color={colors.paper} />
                    </Animated.View>
                    <View style={styles.artLineShort} /><View style={styles.artLineLong} />
                  </View>
                  <View style={styles.artFooter}><Text style={styles.artFooterText}>MEMORIES / IN MOTION</Text><Ionicons name="arrow-forward" size={16} color={colors.primaryLight} /></View>
                </View>
                <Animated.View style={{ opacity: textOpacity, transform: [{ translateX: textTranslate }] }}>
                  <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
                  <Text style={styles.title}>{slide.title}</Text>
                  <Text style={styles.subtitle}>{slide.subtitle}</Text>
                </Animated.View>
              </View>
            );
          })}
        </Animated.ScrollView>
        <View style={styles.navArea}>
          <View style={styles.dotsContainer}>{SLIDES.map((slide, index) => <View key={slide.eyebrow} style={[styles.dot, activeIndex === index && styles.dotActive]} />)}</View>
          <PrimaryButton title="Get Started" onPress={() => router.push('/register')} />
          <TouchableOpacity onPress={() => router.push('/login')} style={styles.linkButton} activeOpacity={0.7}>
            <Text style={styles.linkText}>Already have an account? <Text style={styles.linkTextAccent}>Sign in</Text></Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ScreenShell>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  inner: { flex: 1 },
  header: { paddingTop: 28, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  skip: { color: colors.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  scrollView: { flex: 1 },
  slide: { width, paddingHorizontal: 20, paddingTop: 22, justifyContent: 'center' },
  artCard: { height: 282, borderRadius: radius.xl, backgroundColor: colors.sageDark, padding: 22, overflow: 'hidden', marginBottom: 28 },
  artTopRow: { flexDirection: 'row', justifyContent: 'space-between' },
  artEyebrow: { color: colors.primaryLight, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  artNumber: { color: 'rgba(255,253,248,0.55)', fontSize: 12, fontWeight: '800' },
  artCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  artOrb: { position: 'absolute', width: 172, height: 172, borderRadius: 86, backgroundColor: 'rgba(255,253,248,0.08)' },
  iconTile: { width: 104, height: 104, borderRadius: 34, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '-8deg' }], shadowColor: '#132C27', shadowOpacity: 0.25, shadowRadius: 20, elevation: 8 },
  artLineShort: { width: 70, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,253,248,0.45)', marginTop: 22 },
  artLineLong: { width: 126, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,253,248,0.2)', marginTop: 8 },
  artFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  artFooterText: { color: 'rgba(255,253,248,0.66)', fontSize: 9, fontWeight: '800', letterSpacing: 1.4 },
  eyebrow: { color: colors.primaryDark, fontSize: 11, fontWeight: '900', letterSpacing: 1.4, marginBottom: 10 },
  title: { color: colors.textPrimary, fontSize: 34, lineHeight: 38, fontWeight: '800', letterSpacing: -1, marginBottom: 14 },
  subtitle: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, maxWidth: 330 },
  navArea: { paddingHorizontal: 22, paddingBottom: 24 },
  dotsContainer: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 20 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.borderStrong },
  dotActive: { width: 26, backgroundColor: colors.primary },
  linkButton: { alignItems: 'center', paddingVertical: 4 },
  linkText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  linkTextAccent: { color: colors.primaryDark, fontWeight: '800' },
});
