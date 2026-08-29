import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function SplashScreen() {
  const router = useRouter();
  const { isLoading, user, organizerId } = useAuth();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const logoScale = useRef(new Animated.Value(0.82)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, bounciness: 8, speed: 4 }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 650, useNativeDriver: true }),
      ]),
      Animated.timing(textOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const timeout = setTimeout(() => {
        router.replace(user && organizerId ? '/(tabs)' : '/onboarding');
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [isLoading, user, organizerId]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
        <View style={styles.logoTile}><Ionicons name="aperture-outline" size={58} color="#FFFDF8" /></View>
        <View style={styles.ring} />
      </Animated.View>
      <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
        <Text style={styles.title}>FAST SEND</Text>
        <Text style={styles.subtitle}>MEMORIES, DELIVERED</Text>
      </Animated.View>
      <Text style={styles.version}>PHOTO DELIVERY / 01</Text>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' },
  logoContainer: { width: 148, height: 148, justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
  logoTile: { width: 112, height: 112, borderRadius: 38, backgroundColor: colors.sageDark, justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '-8deg' }], zIndex: 2 },
  ring: { position: 'absolute', width: 132, height: 132, borderRadius: 66, borderWidth: 1, borderColor: colors.primaryLight },
  textContainer: { alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '900', color: colors.textPrimary, letterSpacing: 5 },
  subtitle: { marginTop: 11, color: colors.primaryDark, fontSize: 10, fontWeight: '900', letterSpacing: 2.2 },
  version: { position: 'absolute', bottom: 34, color: colors.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
});
