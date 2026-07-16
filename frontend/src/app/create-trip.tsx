import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';

export default function CreateTripScreen() {
  const router = useRouter();
  const { organizerId } = useAuth();
  const [tripName, setTripName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!organizerId) {
      Alert.alert('Error', 'Not logged in');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizer_id: organizerId,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to create trip');
      
      const trip = await response.json();
      // Store trip ID in local storage here if needed
      
      router.replace('/active-trip');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.yellowStrip}>
        <Text style={styles.logoIcon}>📷</Text>
        <Text style={styles.logoText}>FastSend</Text>
      </View>

      <View style={styles.whiteSection}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Cancel</Text>
        </TouchableOpacity>

        <Text style={styles.heading}>New Trip</Text>
        <Text style={styles.subtitle}>Give your trip a name so you can find it later</Text>

        <InputField 
          placeholder="e.g. Ahmed's Wedding" 
          value={tripName}
          onChangeText={setTripName}
          autoFocus
        />

        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>📷</Text>
          <Text style={styles.infoText}>
            We'll monitor your gallery from the moment you create this trip. A reminder will be sent every 2 hours to push new photos.
          </Text>
        </View>

        <View style={{ flex: 1 }} />

        <PrimaryButton 
          title="Create Trip & Get QR Code" 
          onPress={handleCreate} 
          disabled={!tripName}
          loading={loading}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  yellowStrip: {
    backgroundColor: colors.yellow,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingTop: 20,
  },
  logoIcon: {
    fontSize: 24,
    color: colors.white,
    marginRight: 8,
  },
  logoText: {
    fontSize: typography.size.lg,
    fontWeight: 'bold',
    color: colors.white,
  },
  whiteSection: {
    flex: 1,
    padding: spacing.xl,
  },
  backButton: {
    marginBottom: spacing.lg,
  },
  backText: {
    color: colors.textSecondary,
    fontSize: typography.size.md,
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
  infoCard: {
    backgroundColor: colors.yellowLight,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    lineHeight: typography.size.sm * typography.lineHeight.normal,
  }
});
