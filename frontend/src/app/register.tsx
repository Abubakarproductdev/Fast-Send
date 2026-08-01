import { API_BASE_URL } from '../config/api';
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, KeyboardAvoidingView, Platform,
  ScrollView, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';

export default function RegisterScreen() {
  const router = useRouter();
  const { setOrganizerId } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string; email?: string; password?: string;
    confirmPassword?: string; general?: string;
  }>({});

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, bounciness: 6, speed: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const validate = () => {
    const e: typeof errors = {};
    if (!name.trim()) e.name = 'Full name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email address';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters';
    if (!confirmPassword) e.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(userCredential.user, { displayName: name.trim() });

      let response;
      try {
        response = await fetch(API_BASE_URL + '/api/v1/auth/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firebase_uid: userCredential.user.uid,
            email: userCredential.user.email,
            name: name.trim(),
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
      if (code === 'auth/email-already-in-use') {
        message = 'An account with this email already exists. Try signing in instead.';
        setErrors({ email: message });
        return;
      } else if (code === 'auth/weak-password') {
        message = 'Password is too weak. Use at least 6 characters with letters and numbers.';
        setErrors({ password: message });
        return;
      } else if (code === 'auth/network-request-failed') {
        message = 'Network error. Please check your internet connection.';
      } else if (code === 'auth/invalid-email') {
        message = 'The email address is not valid.';
        setErrors({ email: message });
        return;
      }
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoMark}>
                <Text style={styles.logoIcon}>📷</Text>
              </View>
              <Text style={styles.appName}>FastSend</Text>
              <Text style={styles.heading}>Create account</Text>
              <Text style={styles.subtitle}>Start sharing memories in seconds</Text>
            </View>

            {/* Card */}
            <View style={styles.card}>
              {errors.general && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerIcon}>⚠️</Text>
                  <Text style={styles.errorBannerText}>{errors.general}</Text>
                </View>
              )}

              <InputField
                label="Full Name"
                placeholder="John Doe"
                autoCapitalize="words"
                value={name}
                onChangeText={(t) => { setName(t); setErrors(e => ({ ...e, name: undefined })); }}
                error={errors.name}
                icon="👤"
              />
              <InputField
                label="Email Address"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={(t) => { setEmail(t); setErrors(e => ({ ...e, email: undefined })); }}
                error={errors.email}
                icon="✉️"
              />
              <InputField
                label="Password"
                placeholder="Min. 6 characters"
                secureTextEntry
                value={password}
                onChangeText={(t) => { setPassword(t); setErrors(e => ({ ...e, password: undefined })); }}
                error={errors.password}
                icon="🔒"
              />
              <InputField
                label="Confirm Password"
                placeholder="Repeat your password"
                secureTextEntry
                value={confirmPassword}
                onChangeText={(t) => { setConfirmPassword(t); setErrors(e => ({ ...e, confirmPassword: undefined })); }}
                error={errors.confirmPassword}
                icon="🔒"
              />

              <PrimaryButton
                title={loading ? 'Creating Account...' : 'Create Account'}
                onPress={handleRegister}
                loading={loading}
              />
            </View>

            {/* Footer link */}
            <TouchableOpacity onPress={() => router.push('/login')} style={styles.footerLink}>
              <Text style={styles.footerText}>
                Already have an account?{' '}
                <Text style={styles.footerTextBold}>Sign in →</Text>
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
    paddingTop: spacing.xl,
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
    backgroundColor: colors.amberGlow,
    borderWidth: 1,
    borderColor: colors.amber + '44',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  logoIcon: { fontSize: 32 },
  appName: {
    fontSize: typography.size.sm,
    fontWeight: '700',
    color: colors.amber,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  heading: {
    fontSize: typography.size.xxl,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginTop: spacing.xs,
  },
  subtitle: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
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
  errorBannerIcon: { fontSize: 16 },
  errorBannerText: {
    flex: 1,
    color: colors.error,
    fontSize: typography.size.sm,
    lineHeight: 20,
  },
  footerLink: {
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: typography.size.base,
  },
  footerTextBold: {
    fontWeight: '700',
    color: colors.amber,
  },
});
