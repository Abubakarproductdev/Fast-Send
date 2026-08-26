import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenShell } from '../components/ScreenShell';
import { BrandMark } from '../components/BrandMark';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

export default function RegisterScreen() {
  const router = useRouter();
  const { setOrganizerId } = useAuth();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [confirmPassword, setConfirmPassword] = useState(''); const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string; general?: string }>({});
  const fadeAnim = useRef(new Animated.Value(0)).current; const slideAnim = useRef(new Animated.Value(20)).current;
  useEffect(() => { Animated.parallel([Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }), Animated.spring(slideAnim, { toValue: 0, bounciness: 4, speed: 10, useNativeDriver: true })]).start(); }, []);

  const validate = () => {
    const e: typeof errors = {};
    if (!name.trim()) e.name = 'Full name is required'; if (!email.trim()) e.email = 'Email is required'; else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email address'; if (!password) e.password = 'Password is required'; else if (password.length < 6) e.password = 'Password must be at least 6 characters'; if (!confirmPassword) e.confirmPassword = 'Please confirm your password'; else if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return; setLoading(true); setErrors({});
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(userCredential.user, { displayName: name.trim() });
      const synced = await api.syncOrganizer(userCredential.user.uid, userCredential.user.email, name.trim(), userCredential.user.photoURL);
      await setOrganizerId(synced.organizer_id);
      router.replace('/(tabs)');
    } catch (error: any) { if (error.code === 'auth/email-already-in-use') setErrors({ email: 'Email already in use.' }); else setErrors({ general: error.message }); }
    finally { setLoading(false); }
  };

  return (
    <ScreenShell>
      <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <View style={styles.top}><BrandMark compact /><TouchableOpacity onPress={() => router.back()}><Ionicons name="close-outline" size={26} color={colors.textSecondary} /></TouchableOpacity></View>
            <View style={styles.header}><Text style={styles.eyebrow}>GET STARTED</Text><Text style={styles.title}>Make room for more moments.</Text><Text style={styles.subtitle}>Set up your organizer profile and start sharing.</Text></View>
            <View style={styles.form}>
              {errors.general && <View style={styles.errorBanner}><Ionicons name="warning-outline" size={18} color={colors.error} /><Text style={styles.errorText}>{errors.general}</Text></View>}
              <InputField label="Full name" placeholder="Ahmed Raza" autoCapitalize="words" value={name} onChangeText={(t) => { setName(t); setErrors(e => ({ ...e, name: undefined })); }} error={errors.name} />
              <InputField label="Email address" placeholder="ahmed@example.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} value={email} onChangeText={(t) => { setEmail(t); setErrors(e => ({ ...e, email: undefined })); }} error={errors.email} />
              <InputField label="Password" placeholder="••••••••" secureTextEntry value={password} onChangeText={(t) => { setPassword(t); setErrors(e => ({ ...e, password: undefined })); }} error={errors.password} />
              <InputField label="Confirm password" placeholder="••••••••" secureTextEntry value={confirmPassword} onChangeText={(t) => { setConfirmPassword(t); setErrors(e => ({ ...e, confirmPassword: undefined })); }} error={errors.confirmPassword} />
              <PrimaryButton title={loading ? 'Creating account...' : 'Create account'} onPress={handleRegister} loading={loading} style={styles.submitBtn} />
            </View>
            <TouchableOpacity onPress={() => router.push('/login')} style={styles.footerLink}><Text style={styles.footerText}>Already a member? <Text style={styles.footerAccent}>Sign in</Text></Text></TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  kav: { flex: 1 }, scroll: { flexGrow: 1, paddingTop: 16, paddingBottom: 40 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 38 },
  header: { marginBottom: 28 }, eyebrow: { color: colors.primaryDark, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 10 },
  title: { color: colors.textPrimary, fontSize: 32, lineHeight: 37, fontWeight: '800', letterSpacing: -0.8, marginBottom: 10 }, subtitle: { color: colors.textSecondary, fontSize: 15, lineHeight: 22 },
  form: { backgroundColor: colors.paper, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: 20 },
  errorBanner: { flexDirection: 'row', gap: 9, alignItems: 'center', backgroundColor: colors.errorLight, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg }, errorText: { color: colors.error, flex: 1, fontSize: 13, fontWeight: '700', lineHeight: 18 },
  submitBtn: { marginBottom: 0 }, footerLink: { alignItems: 'center', marginTop: 28 }, footerText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' }, footerAccent: { color: colors.primaryDark, fontWeight: '800' },
});
