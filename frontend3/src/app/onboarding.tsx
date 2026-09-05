import React, { useState } from 'react';
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
import { useTheme } from '../theme/ThemeContext';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const { colors, neoShadow, neoShadowLg } = useTheme();

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

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    if (slideIndex !== activeIndex && slideIndex >= 0 && slideIndex < SLIDES.length) {
      setActiveIndex(slideIndex);
    }
  };

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
      fontSize: 15,
      fontFamily: 'Nunito_900Black',
      letterSpacing: 2,
      color: colors.ink,
    },
    skipText: {
      fontSize: 12,
      fontFamily: 'Nunito_800ExtraBold',
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
      borderWidth: 1.5,
      borderTopWidth: 4,
      borderColor: colors.ink,
      padding: 24,
    },
    cardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    eyebrowText: {
      fontSize: 12,
      fontFamily: 'Nunito_800ExtraBold',
      textTransform: 'uppercase',
      letterSpacing: 1.8,
      color: colors.textSecondary,
    },
    iconBox: {
      width: 54,
      height: 54,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: colors.ink,
      justifyContent: 'center',
      alignItems: 'center',
      transform: [{ rotate: '6deg' }],
    },
    titleText: {
      fontSize: 32,
      fontFamily: 'Nunito_900Black',
      lineHeight: 38,
      color: colors.ink,
      marginBottom: 12,
    },
    subtitleText: {
      fontSize: 14,
      fontFamily: 'Nunito_700Bold',
      lineHeight: 20,
      color: colors.textSecondary,
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
      marginBottom: 20,
    },
    dotActive: {
      width: 28,
      height: 9,
      borderRadius: 5,
      borderWidth: 1.5,
      borderColor: colors.ink,
      backgroundColor: colors.brand,
    },
    dotInactive: {
      width: 9,
      height: 9,
      borderRadius: 5,
      borderWidth: 1.5,
      borderColor: colors.ink,
      backgroundColor: colors.creamDeep,
    },
    signInLink: {
      marginTop: 18,
      alignItems: 'center',
    },
    signInText: {
      fontSize: 14,
      fontFamily: 'Nunito_700Bold',
      color: colors.textSecondary,
    },
    signInHighlight: {
      fontFamily: 'Nunito_900Black',
      color: colors.flame,
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <CameraBadge size={36} />
          <Text style={styles.brandText}>FAST SEND</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/register')} activeOpacity={0.7}>
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
                    <IconComponent size={24} strokeWidth={2.6} color={colors.cream} />
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
              style={activeIndex === i ? styles.dotActive : styles.dotInactive}
            />
          ))}
        </View>

        <NeoButton
          title="Create a free account"
          onPress={() => router.push('/register')}
          size="lg"
          icon={<ArrowRight size={19} strokeWidth={3} color={colors.ink} />}
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
