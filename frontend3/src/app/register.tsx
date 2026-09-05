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
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { api } from '../services/api';
import { parseFirebaseError } from '../utils/errors';
import { CameraBadge } from '../components/CameraBadge';
import { StatusBar } from '../components/StatusBar';
import { NeoField } from '../components/ui/NeoField';
import { NeoInput } from '../components/ui/NeoInput';
import { NeoButton } from '../components/ui/NeoButton';
import { useTheme } from '../theme/ThemeContext';

export default function RegisterScreen() {
  const router = useRouter();
  const { colors, neoShadow } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill out all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const res = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(res.user, { displayName: name.trim() });
      await api.syncOrganizer(res.user.uid, res.user.email, name.trim());
      router.replace('/(tabs)');
    } catch (err) {
      setError(parseFirebaseError(err));
    } finally {
      setBusy(false);
    }
  };

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
      width: 43,
      height: 43,
      borderRadius: 22,
      borderWidth: 2,
      borderColor: colors.ink,
      backgroundColor: colors.white,
      justifyContent: 'center',
      alignItems: 'center',
    },
    spacer: {
      width: 43,
    },
    headerTitles: {
      marginBottom: 24,
    },
    kicker: {
      fontSize: 12,
      fontWeight: '900',
      fontFamily: 'Nunito_900Black',
      letterSpacing: 2,
      color: colors.flame,
      marginBottom: 6,
    },
    title: {
      fontSize: 36,
      fontWeight: '900',
      fontFamily: 'Nunito_900Black',
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
      fontSize: 14,
      fontWeight: '800',
      fontFamily: 'Nunito_800ExtraBold',
      color: colors.ink,
    },
    btnWrapper: {
      marginTop: 10,
      marginBottom: 18,
    },
    switchLink: {
      alignItems: 'center',
    },
    switchText: {
      fontSize: 14,
      fontWeight: '700',
      fontFamily: 'Nunito_700Bold',
      color: colors.mut,
    },
    switchHighlight: {
      fontWeight: '900',
      fontFamily: 'Nunito_900Black',
      color: colors.flame,
    },
  });

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
        {/* Top Nav */}
        <View style={styles.topNav}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, neoShadow]}
            activeOpacity={0.8}
          >
            <ChevronLeft size={19} strokeWidth={3} color={colors.ink} />
          </TouchableOpacity>
          <CameraBadge size={48} />
          <View style={styles.spacer} />
        </View>

        <View style={styles.headerTitles}>
          <Text style={styles.kicker}>JOIN FAST SEND</Text>
          <Text style={styles.title}>Create an account.</Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Inputs */}
        <NeoField label="Your name">
          <NeoInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Alex Smith"
            autoCapitalize="words"
          />
        </NeoField>

        <NeoField label="Email address">
          <NeoInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@domain.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </NeoField>

        <NeoField label="Password (at least 6 characters)">
          <NeoInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />
        </NeoField>

        <View style={styles.btnWrapper}>
          <NeoButton
            title="Create account"
            onPress={handleRegister}
            loading={busy}
            size="lg"
          />
        </View>

        <TouchableOpacity
          onPress={() => router.replace('/login')}
          style={styles.switchLink}
          activeOpacity={0.7}
        >
          <Text style={styles.switchText}>
            Already have an account?{' '}
            <Text style={styles.switchHighlight}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
