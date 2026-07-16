import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { InputField } from '../../components/InputField';
import { PrimaryButton } from '../../components/PrimaryButton';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = () => {
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
        <ScrollView bounces={false}>
          {/* Yellow Strip */}
          <View style={styles.yellowStrip}>
            <Text style={styles.logoIcon}>📷</Text>
            <Text style={styles.logoText}>FastSend</Text>
          </View>

          {/* White Section */}
          <View style={styles.whiteSection}>
            <Text style={styles.heading}>Create account</Text>
            <Text style={styles.subtitle}>Join FastSend today</Text>

            <InputField 
              placeholder="Full Name" 
              value={name}
              onChangeText={setName}
            />

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

            <InputField 
              placeholder="Confirm Password" 
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            
            <PrimaryButton 
              title="Create Account" 
              onPress={handleRegister} 
              loading={loading}
            />

            <TouchableOpacity onPress={() => router.push('/login')} style={styles.linkButton}>
              <Text style={styles.linkText}>Already have an account? <Text style={styles.linkTextBold}>Sign in</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
