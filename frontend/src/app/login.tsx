import { API_BASE_URL } from '../config/api';
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert,
  ScrollView, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenShell } from '../components/ScreenShell';

export default function LoginScreen() {
  const router = useRouter();
  const { setOrganizerId } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, bounciness: 4, speed: 10, useNativeDriver: true }),
    ]).start();
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
    } catch (error: any) {
      Alert.alert('Error', 'Could not send reset email. Please check the address and try again.');
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
            {/* Header Section */}
            <View style={styles.header}>
              <Text style={styles.preTitle}>WELCOME BACK</Text>
              <Text style={styles.title}>Sign In</Text>
              <Text style={styles.subtitle}>Enter your credentials to access your trips</Text>
            </View>

            {/* Form Section */}
            <View style={styles.form}>
              {errors.general && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{errors.general}</Text>
                </View>
              )}

              <InputField
                label="Email Address"
                placeholder="you@luxeroam.com"
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

              <TouchableOpacity 
                onPress={handleForgotPassword} 
                style={styles.forgotRow}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              <PrimaryButton
                title={loading ? 'Authenticating...' : 'Sign In'}
                onPress={handleLogin}
                loading={loading}
                style={styles.submitBtn}
              />
            </View>

            {/* Footer Section */}
            <TouchableOpacity 
              onPress={() => router.push('/register')} 
              style={styles.footerLink}
              activeOpacity={0.7}
            >
              <Text style={styles.footerText}>
                New to Fast Send? <Text style={styles.footerTextGold}>Create Account</Text>
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
    marginBottom: 48,
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
  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: 32,
    marginTop: -8,
  },
  forgotText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: 8,
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
