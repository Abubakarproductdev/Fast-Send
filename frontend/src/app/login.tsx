import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { InputField } from '../../components/InputField';
import { PrimaryButton } from '../../components/PrimaryButton';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    // Mock API call
    setTimeout(() => {
      setLoading(false);
      router.replace('/(tabs)');
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Yellow Strip */}
        <View style={styles.yellowStrip}>
          <Text style={styles.logoIcon}>📷</Text>
          <Text style={styles.logoText}>FastSend</Text>
        </View>

        {/* White Section */}
        <View style={styles.whiteSection}>
          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          <InputField 
            placeholder="Email Address" 
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          
          <InputField 
            placeholder="Password" 
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          
          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <PrimaryButton 
            title="Sign In" 
            onPress={handleLogin} 
            loading={loading}
          />

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <PrimaryButton 
            title="Continue with Google" 
            onPress={() => {}} 
            type="secondary"
          />

          <TouchableOpacity onPress={() => router.push('/register')} style={styles.linkButton}>
            <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkTextBold}>Create one</Text></Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  keyboardView: {
    flex: 1,
  },
  yellowStrip: {
    backgroundColor: colors.yellow,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 40,
    color: colors.white,
  },
  logoText: {
    fontSize: typography.size.xl,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: spacing.sm,
  },
  whiteSection: {
    flex: 1,
    padding: spacing.xl,
  },
  heading: {
    fontSize: typography.size.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.xl,
  },
  forgotPasswordText: {
    color: colors.yellowDark,
    fontSize: typography.size.sm,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.divider,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    color: colors.textSecondary,
  },
  linkButton: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  linkText: {
    color: colors.textSecondary,
    fontSize: typography.size.base,
  },
  linkTextBold: {
    fontWeight: 'bold',
    color: colors.textPrimary,
  }
});
