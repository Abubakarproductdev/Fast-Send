import { API_BASE_URL } from '../config/api';
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, KeyboardAvoidingView, Platform, Alert,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius, shadows } from '../theme/spacing';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';

export default function LoginScreen() {
  const router = useRouter();
  const { setOrganizerId } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(40);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 480, easing: Easing.out(Easing.cubic) });
    translateY.value = withSpring(0, { damping: 22, stiffness: 200 });
  }, []);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Enter a valid email address';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);

      let response;
      try {
        response = await fetch(API_BASE_URL + '/api/v1/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firebase_uid: userCredential.user.uid,
            email: userCredential.user.email,
          }),
        });
      } catch (networkErr) {
        throw new Error('Cannot reach server. Check your network connection and try again.');
      }

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.detail || `Server error (${response.status}). Please try again.`);
      }

      const data = await response.json();
      setOrganizerId(data.organizer_id);
      router.replace('/(tabs)');
    } catch (error: any) {
      const code = error.code || '';
      let message = error.message;
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        message = 'Incorrect email or password. Please try again.';
      } else if (code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Please wait a moment before trying again.';
      } else if (code === 'auth/network-request-failed') {
        message = 'Network error. Please check your internet connection.';
      } else if (code === 'auth/user-disabled') {
        message = 'This account has been disabled. Please contact support.';
      }
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setErrors({ email: 'Enter your email first to reset your password.' });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert('Check your inbox', `A password reset link has been sent to ${email}.`);
    } catch {
      Alert.alert('Error', 'Could not send reset email. Please check the address and try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Subtle top glow */}
      <LinearGradient
        colors={['rgba(196,241,53,0.04)', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={animStyle}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoMark}>
                <LinearGradient
                  colors={['rgba(196,241,53,0.18)', 'rgba(196,241,53,0.06)']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <Ionicons name="camera" size={32} color={colors.lime} />
              </View>
              <Text style={styles.appName}>FastSend</Text>
              <Text style={styles.heading}>Welcome back</Text>
              <Text style={styles.subtitle}>Sign in to manage your trips</Text>
            </View>

            {/* Card */}
            <View style={styles.card}>
              {errors.general && (
                <View style={styles.errorBanner}>
                  <Ionicons name="warning" size={16} color={colors.error} />
                  <Text style={styles.errorBannerText}>{errors.general}</Text>
                </View>
              )}

              <InputField
                label="Email Address"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={(t) => { setEmail(t); setErrors(e => ({ ...e, email: undefined })); }}
                error={errors.email}
                iconName="mail-outline"
              />

              <InputField
                label="Password"
                placeholder="Your password"
                secureTextEntry
                value={password}
                onChangeText={(t) => { setPassword(t); setErrors(e => ({ ...e, password: undefined })); }}
                error={errors.password}
                iconName="lock-closed-outline"
              />

              <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotRow}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              <PrimaryButton
                title={loading ? 'Signing In...' : 'Sign In'}
                onPress={handleLogin}
                loading={loading}
              />
            </View>

            {/* Footer link */}
            <TouchableOpacity onPress={() => router.push('/register')} style={styles.footerLink}>
              <Text style={styles.footerText}>
                Don't have an account?{' '}
                <Text style={styles.footerTextBold}>Create one {'\u2192'}</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  kav: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(196,241,53,0.30)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  appName: {
    fontSize: typography.size.xs,
    fontFamily: typography.fontBold,
    color: colors.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  heading: {
    fontSize: typography.size.xxl,
    fontFamily: typography.fontExtraBold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginTop: spacing.xs,
  },
  subtitle: {
    fontSize: typography.size.base,
    fontFamily: typography.fontRegular,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    ...shadows.sm,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.error + '40',
  },
  errorBannerText: {
    flex: 1,
    color: colors.error,
    fontSize: typography.size.sm,
    fontFamily: typography.fontMedium,
    lineHeight: 20,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
    marginTop: -spacing.xs,
  },
  forgotText: {
    color: colors.lime,
    fontSize: typography.size.sm,
    fontFamily: typography.fontSemiBold,
  },
  footerLink: {
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: typography.size.base,
    fontFamily: typography.fontRegular,
  },
  footerTextBold: {
    fontFamily: typography.fontBold,
    color: colors.lime,
  },
});
