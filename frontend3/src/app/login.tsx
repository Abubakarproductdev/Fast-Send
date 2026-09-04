import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { parseFirebaseError } from '../utils/errors';
import { CameraBadge } from '../components/CameraBadge';
import { StatusBar } from '../components/StatusBar';
import { NeoField } from '../components/ui/NeoField';
import { NeoInput } from '../components/ui/NeoInput';
import { NeoButton } from '../components/ui/NeoButton';
import { colors, neoShadow } from '../theme/colors';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Enter both your email and password.');
      return;
    }
    setBusy(true);
    setError('');
    setInfo('');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace('/(tabs)');
    } catch (err) {
      setError(parseFirebaseError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleForgot = async () => {
    if (!email.trim()) {
      setError('Enter your email address first to reset password.');
      return;
    }
    setResetBusy(true);
    setError('');
    setInfo('');
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfo('Password reset email sent. Check your inbox.');
    } catch (err) {
      setError(parseFirebaseError(err));
    } finally {
      setResetBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <StatusBar />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Header */}
        <View style={styles.topNav}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, neoShadow]}
            activeOpacity={0.8}
          >
            <ChevronLeft size={16} strokeWidth={3} color={colors.ink} />
          </TouchableOpacity>
          <CameraBadge size={40} />
          <View style={styles.spacer} />
        </View>

        <View style={styles.headerTitles}>
          <Text style={styles.kicker}>WELCOME BACK</Text>
          <Text style={styles.title}>Sign back in.</Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {info ? (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>{info}</Text>
          </View>
        ) : null}

        {/* Inputs */}
        <NeoField label="Email address">
          <NeoInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@domain.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </NeoField>

        <NeoField label="Password">
          <NeoInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />
        </NeoField>

        <TouchableOpacity
          onPress={handleForgot}
          disabled={resetBusy}
          style={styles.forgotBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.forgotText}>
            {resetBusy ? 'Sending reset email…' : 'Forgot your password? Reset it.'}
          </Text>
        </TouchableOpacity>

        <View style={styles.btnWrapper}>
          <NeoButton
            title="Sign in"
            onPress={handleLogin}
            loading={busy}
            size="lg"
          />
        </View>

        <TouchableOpacity
          onPress={() => router.replace('/register')}
          style={styles.switchLink}
          activeOpacity={0.7}
        >
          <Text style={styles.switchText}>
            Don't have an account?{' '}
            <Text style={styles.switchHighlight}>Create one</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spacer: {
    width: 36,
  },
  headerTitles: {
    marginBottom: 24,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    color: colors.flame,
    marginBottom: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.ink,
  },
  errorBox: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.flameSoft,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.ink,
  },
  infoBox: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.leafSoft,
    padding: 12,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.ink,
  },
  forgotBtn: {
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.mut,
  },
  btnWrapper: {
    marginBottom: 18,
  },
  switchLink: {
    alignItems: 'center',
  },
  switchText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(16, 16, 16, 0.65)',
  },
  switchHighlight: {
    fontWeight: '900',
    color: colors.flame,
  },
});
