import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, Image, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

export default function RegisterScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const takeSelfie = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5, // Optimize for backend ML
    });

    if (!result.canceled) {
      setSelfieUri(result.assets[0].uri);
    }
  };

  const handleRegister = () => {
    if (!phoneNumber || !selfieUri) return;
    setLoading(true);
    // Mock API Call
    setTimeout(() => {
      setLoading(false);
      // Redirect to Gallery
      router.replace(`/trip/${id}/gallery/mock_attendee_456`);
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#1E293B', '#0F172A']} style={StyleSheet.absoluteFillObject} />
      
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Who are you?</Text>
            <Text style={styles.subtitle}>Take a selfie so our AI can find your photos in this trip.</Text>
          </View>

          <View style={styles.form}>
            <TouchableOpacity style={styles.selfieContainer} onPress={takeSelfie}>
              {selfieUri ? (
                <Image source={{ uri: selfieUri }} style={styles.selfieImage} />
              ) : (
                <View style={styles.selfiePlaceholder}>
                  <Text style={styles.selfieIcon}>📷</Text>
                  <Text style={styles.selfieText}>Tap to take selfie</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Name (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ahmed"
                placeholderTextColor="#475569"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>WhatsApp Number</Text>
              <TextInput
                style={styles.input}
                placeholder="+923001234567"
                placeholderTextColor="#475569"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </View>

            <TouchableOpacity 
              style={[styles.button, (!phoneNumber || !selfieUri) && styles.buttonDisabled]} 
              onPress={handleRegister}
              disabled={!phoneNumber || !selfieUri || loading}
            >
              <Text style={styles.buttonText}>{loading ? 'Joining Trip...' : 'Join Trip'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  header: { padding: 24, paddingTop: 40 },
  title: { fontSize: 32, fontWeight: '700', color: '#F8FAFC', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#94A3B8', lineHeight: 24 },
  form: { paddingHorizontal: 24, paddingTop: 20 },
  selfieContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignSelf: 'center',
    marginBottom: 40,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#6366F1',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  selfieImage: { width: '100%', height: '100%' },
  selfiePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selfieIcon: { fontSize: 32, marginBottom: 8 },
  selfieText: { color: '#94A3B8', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  inputContainer: { marginBottom: 24 },
  label: { color: '#E2E8F0', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#F8FAFC',
  },
  button: {
    backgroundColor: '#6366F1',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: { backgroundColor: '#334155' },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
});
