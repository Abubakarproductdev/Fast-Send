import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'react-router-native'; // Actually Expo Router uses useRouter from 'expo-router'
import { useRouter as useExpoRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function CreateTripScreen() {
  const router = useExpoRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = () => {
    if (!name.trim()) return;
    setLoading(true);
    // Mock API call
    setTimeout(() => {
      setLoading(false);
      // Redirect to Organizer Dashboard with dummy trip id
      router.replace('/trip/mock_trip_id_123');
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
          <Text style={styles.title}>Host a Trip</Text>
          <Text style={styles.subtitle}>Enter your name to generate a unique invite code for your group.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Organizer Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Abubakar"
              placeholderTextColor="#475569"
              value={name}
              onChangeText={setName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreate}
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, !name.trim() && styles.buttonDisabled]} 
            onPress={handleCreate}
            disabled={!name.trim() || loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Generate Invite Code'}</Text>
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
    fontSize: 18,
    color: '#F8FAFC',
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
