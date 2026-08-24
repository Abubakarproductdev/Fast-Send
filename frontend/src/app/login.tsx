import { API_BASE_URL } from '../config/api';
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenShell } from '../components/ScreenShell';
import { BrandMark } from '../components/BrandMark';
import { useTheme } from '../context/ThemeContext';

export default function LoginScreen() {
  const router = useRouter();
  const { setOrganizerId } = useAuth();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
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
    setLoading(true); setErrors({});
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      let response;
      try {
        response = await fetch(API_BASE_URL + '/api/v1/auth/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ firebase_uid: userCredential.user.uid, email: userCredential.user.email }) });
      } catch (networkErr) { throw new Error('Cannot reach server. Check your network connection and try again.'); }
      if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.detail || `Server error (${response.status}). Please try again.`); }
      const data = await response.json(); setOrganizerId(data.organizer_id); router.replace('/(tabs)');
    } catch (error: any) {
      const code = error.code || '';
      let message = error.message;
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') message = 'Incorrect email or password. Please try again.';
      else if (code === 'auth/too-many-requests') message = 'Too many failed attempts. Please wait a moment before trying again.';
      else if (code === 'auth/network-request-failed') message = 'Network error. Please check your internet connection.';
      else if (code === 'auth/user-disabled') message = 'This account has been disabled. Please contact support.';
      setErrors({ general: message });
    } finally { setLoading(false); }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) { setErrors({ email: 'Enter your email first to reset your password.' }); return; }
    try { await sendPasswordResetEmail(auth, email.trim()); Alert.alert('Check your inbox', `A password reset link has been sent to ${email}.`); }
    catch (error: any) { Alert.alert('Error', 'Could not send reset email. Please check the address and try again.'); }
  };

  return (
    <ScreenShell>
      <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <View style={styles.top}><BrandMark compact /><TouchableOpacity onPress={() => router.back()}><Ionicons name="close-outline" size={26} color={colors.textSecondary} /></TouchableOpacity></View>
            <View style={styles.header}><Text style={styles.eyebrow}>WELCOME BACK</Text><Text style={styles.title}>Good to see you.</Text><Text style={styles.subtitle}>Your next collection is waiting.</Text></View>
            <View style={styles.form}>
              {errors.general && <View style={styles.errorBanner}><Ionicons name="warning-outline" size={18} color={colors.error} /><Text style={styles.errorBannerText}>{errors.general}</Text></View>}
              <InputField label="Email address" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} value={email} onChangeText={(t) => { setEmail(t); setErrors(e => ({ ...e, email: undefined })); }} error={errors.email} />
              <InputField label="Password" placeholder="••••••••" secureTextEntry value={password} onChangeText={(t) => { setPassword(t); setErrors(e => ({ ...e, password: undefined })); }} error={errors.password} />
              <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotRow}><Text style={styles.forgotText}>Forgot password?</Text><Ionicons name="arrow-forward" size={14} color={colors.primaryDark} /></TouchableOpacity>
              <PrimaryButton title={loading ? 'Authenticating...' : 'Sign in'} onPress={handleLogin} loading={loading} style={styles.submitBtn} />
            </View>
            <TouchableOpacity onPress={() => router.push('/register')} style={styles.footerLink}><Text style={styles.footerText}>New to Fast Send? <Text style={styles.footerAccent}>Create an account</Text></Text></TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  kav: { flex: 1 },
  scroll: { flexGrow: 1, paddingTop: 16, paddingBottom: 40 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 52 },
  header: { marginBottom: 36 },
  eyebrow: { color: colors.primaryDark, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 10 },
  title: { color: colors.textPrimary, fontSize: 34, lineHeight: 38, fontWeight: '800', letterSpacing: -0.8, marginBottom: 10 },
  subtitle: { color: colors.textSecondary, fontSize: 15, lineHeight: 22 },
  form: { backgroundColor: colors.paper, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: 20 },
  errorBanner: { flexDirection: 'row', gap: 9, alignItems: 'center', backgroundColor: colors.errorLight, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg },
  errorBannerText: { color: colors.error, flex: 1, fontSize: 13, fontWeight: '700', lineHeight: 18 },
  forgotRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 6, marginTop: -5, marginBottom: 20 },
  forgotText: { color: colors.primaryDark, fontSize: 13, fontWeight: '800' },
  submitBtn: { marginBottom: 0 },
  footerLink: { alignItems: 'center', marginTop: 28 },
  footerText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  footerAccent: { color: colors.primaryDark, fontWeight: '800' },
});
