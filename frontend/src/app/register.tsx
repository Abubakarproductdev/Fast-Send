import { API_BASE_URL } from '../config/api';
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform,
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
import { ScreenShell } from '../components/ScreenShell';

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
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, bounciness: 4, speed: 10, useNativeDriver: true }),
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

      const response = await fetch(API_BASE_URL + '/api/v1/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebase_uid: userCredential.user.uid,
          email: userCredential.user.email,
          name: name.trim(),
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.detail || 'Sync failed');
      }

      const data = await response.json();
      setOrganizerId(data.organizer_id);
      router.replace('/(tabs)');
    } catch (error: any) {
      const code = error.code || '';
      let message = error.message;
      if (code === 'auth/email-already-in-use') {
        setErrors({ email: 'Email already in use.' });
        return;
      }
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell>
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
              <Text style={styles.preTitle}>GET STARTED</Text>
              <Text style={styles.title}>Join Us</Text>
              <Text style={styles.subtitle}>Create your premium account to start sharing.</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {errors.general && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{errors.general}</Text>
                </View>
              )}

              <InputField
                label="Full Name"
                placeholder="Ahmed Raza"
                autoCapitalize="words"
                value={name}
                onChangeText={(t) => { setName(t); setErrors(e => ({ ...e, name: undefined })); }}
                error={errors.name}
              />
              <InputField
                label="Email Address"
                placeholder="ahmed@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={(t) => { setEmail(t); setErrors(e => ({ ...e, email: undefined })); }}
                error={errors.email}
              />
              <InputField
                label="Password"
                placeholder="••••••••"
                secureTextEntry
                value={password}
                onChangeText={(t) => { setPassword(t); setErrors(e => ({ ...e, password: undefined })); }}
                error={errors.password}
              />
              <InputField
                label="Confirm Password"
                placeholder="••••••••"
                secureTextEntry
                value={confirmPassword}
                onChangeText={(t) => { setConfirmPassword(t); setErrors(e => ({ ...e, confirmPassword: undefined })); }}
                error={errors.confirmPassword}
              />

              <PrimaryButton
                title={loading ? 'Creating Account...' : 'Create Account'}
                onPress={handleRegister}
                loading={loading}
                style={styles.submitBtn}
              />
            </View>

            {/* Footer link */}
            <TouchableOpacity 
              onPress={() => router.push('/login')} 
              style={styles.footerLink}
              activeOpacity={0.7}
            >
              <Text style={styles.footerText}>
                Already a member? <Text style={styles.footerTextGold}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  kav: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 40,
  },
  preTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -1,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  form: {
    gap: 0,
  },
  errorBanner: {
    backgroundColor: colors.errorLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  errorBannerText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: 16,
  },
  footerLink: {
    alignItems: 'center',
    marginTop: 40,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  footerTextGold: {
    color: colors.primary,
    fontWeight: '700',
  },
});
