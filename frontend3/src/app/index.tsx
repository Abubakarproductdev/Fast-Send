import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { CameraBadge } from '../components/CameraBadge';
import { colors } from '../theme/colors';

export default function SplashScreen() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(0.82)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => {
      if (user) {
        router.replace('/(tabs)');
      } else {
        router.replace('/onboarding');
      }
    }, 900);
    return () => clearTimeout(timer);
  }, [isLoading, user]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: opacityAnim }}>
        <CameraBadge size={84} />
      </Animated.View>

      <Animated.View style={[styles.copy, { opacity: opacityAnim }]}>
        <Text style={styles.title}>FAST SEND</Text>
        <Text style={styles.subtitle}>Memories, delivered</Text>
      </Animated.View>

      <Text style={styles.footer}>Photo delivery / 01</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
  },
  copy: {
    marginTop: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 4,
    color: colors.ink,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: colors.flame,
    marginTop: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    color: colors.mut,
  },
});
