import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function JoinTripScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = () => {
    if (code.length < 6) return;
    setLoading(true);
    // Mock API call to validate code
    setTimeout(() => {
      setLoading(false);
      // Redirect to Registration with dummy trip id
      router.replace('/trip/mock_trip_id_123/register');
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#1E293B', '#0F172A']} style={StyleSheet.absoluteFillObject} />
      
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Join a Trip</Text>
          <Text style={styles.subtitle}>Enter the 8-character invite code from the organizer.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Invite Code</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. FA3B2C89"
              placeholderTextColor="#475569"
              value={code}
              onChangeText={(text) => setCode(text.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={8}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleJoin}
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, code.length < 6 && styles.buttonDisabled]} 
            onPress={handleJoin}
            disabled={code.length < 6 || loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Joining...' : 'Continue'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  keyboardView: { flex: 1 },
  header: { padding: 24, paddingTop: 40 },
  backButton: { marginBottom: 24 },
  backButtonText: { color: '#94A3B8', fontSize: 16 },
  title: { fontSize: 36, fontWeight: '700', color: '#F8FAFC', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#94A3B8', lineHeight: 24 },
  form: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  inputContainer: { marginBottom: 32 },
  label: { color: '#E2E8F0', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    color: '#F8FAFC',
    textAlign: 'center',
    letterSpacing: 4,
  },
  button: {
    backgroundColor: '#6366F1',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: { backgroundColor: '#334155' },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
});
