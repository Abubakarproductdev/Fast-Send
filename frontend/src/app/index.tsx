import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

export default function SplashScreen() {
  const router = useRouter();
  const { isLoading, user, organizerId } = useAuth();

  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          useNativeDriver: true,
          bounciness: 8,
          speed: 4,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 600,
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
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [isLoading, user, organizerId]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          { transform: [{ scale: logoScale }], opacity: logoOpacity },
        ]}
      >
        <Text style={styles.logoIcon}>✨</Text>
        <View style={styles.logoGlow} />
      </Animated.View>
      
      <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
        <Text style={styles.title}>FAST SEND</Text>
        <View style={styles.divider} />
        <Text style={styles.subtitle}>PREMIUM PHOTO DELIVERY</Text>
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
  },
  logoContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  logoIcon: {
    fontSize: 64,
    zIndex: 2,
  },
  logoGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryGlow,
    zIndex: 1,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 8,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: colors.primary,
    marginVertical: 16,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textGold,
    letterSpacing: 3,
  },
});
