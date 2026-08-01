import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useAuth } from '../context/AuthContext';

export default function SplashScreen() {
  const router = useRouter();
  const { isLoading, user, organizerId } = useAuth();

  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          useNativeDriver: true,
          bounciness: 10,
          speed: 6,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const timeout = setTimeout(() => {
        if (user && organizerId) {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding');
        }
      }, 1200);
      return () => clearTimeout(timeout);
    }
  }, [isLoading, user, organizerId]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoRing,
          { transform: [{ scale: logoScale }], opacity: logoOpacity },
        ]}
      >
        <Text style={styles.icon}>📷</Text>
      </Animated.View>
      <Animated.View style={{ opacity: logoOpacity }}>
        <Text style={styles.title}>FastSend</Text>
      </Animated.View>
      <Animated.View style={{ opacity: taglineOpacity }}>
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
  logoRing: {
    width: 100,
    height: 100,
    borderRadius: 32,
    backgroundColor: colors.amberGlow,
    borderWidth: 1,
    borderColor: colors.amber,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 44,
  },
  title: {
    fontSize: typography.size.hero,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },
});
