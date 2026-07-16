import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { PrimaryButton } from '../../components/PrimaryButton';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    icon: '📷',
    title: 'Start a Trip',
    subtitle: 'Create a trip in seconds and start capturing memories.',
  },
  {
    icon: '☁️',
    title: 'Auto-Push Photos',
    subtitle: 'We remind you to upload. One tap and all new photos are sent.',
  },
  {
    icon: '📲',
    title: 'Share Instantly',
    subtitle: 'Guests scan the QR and get their photos on WhatsApp automatically.',
  }
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setActiveIndex(index);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.scrollView}
      >
        {SLIDES.map((slide, index) => (
          <View key={index} style={styles.slide}>
            <Text style={styles.icon}>{slide.icon}</Text>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.subtitle}>{slide.subtitle}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomSection}>
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                activeIndex === index && styles.activeDot
              ]}
            />
          ))}
        </View>

        <PrimaryButton 
          title="Get Started" 
          onPress={() => router.push('/login')} 
        />
        
        <TouchableOpacity onPress={() => router.push('/login')} style={styles.linkButton}>
          <Text style={styles.linkText}>Already have an account? Log in</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  icon: {
    fontSize: 80,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.size.base * typography.lineHeight.normal,
  },
  bottomSection: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.divider,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: colors.yellow,
    width: 24,
  },
  linkButton: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  linkText: {
    color: colors.textSecondary,
    fontSize: typography.size.base,
  }
});
