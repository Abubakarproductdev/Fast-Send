import { API_BASE_URL } from '../config/api';
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, Animated, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { scheduleUploadReminders } from '../services/NotificationService';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenShell } from '../components/ScreenShell';

export default function CreateTripScreen() {
  const router = useRouter();
  const { organizerId, setActiveTripId, setTripStartTime } = useAuth();
  const [tripName, setTripName] = useState('');
  const [loading, setLoading] = useState(false);
  const [tripNameError, setTripNameError] = useState<string | undefined>();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, bounciness: 4, speed: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleCreate = async () => {
    if (!tripName.trim()) {
      setTripNameError('Please give your trip a name');
      return;
    }
    if (!organizerId) {
      Alert.alert('Session Error', 'Please sign in again.');
      router.replace('/login');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/trips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizer_id: organizerId }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.detail || 'Failed to create trip');
      }

      const trip = await response.json();
      const deviceStartTime = new Date().toISOString();

      await setActiveTripId(trip.id);
      await setTripStartTime(deviceStartTime);

      scheduleUploadReminders().catch(() => {});
      router.replace('/active-trip');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={styles.backBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.preTitle}>NEW JOURNEY</Text>
            <Text style={styles.title}>Create Trip</Text>
            <Text style={styles.subtitle}>Set up a new session to begin sharing memories.</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <InputField
              label="Trip Name"
              placeholder="e.g. Summer Gala 2026"
              value={tripName}
              onChangeText={(t) => { setTripName(t); setTripNameError(undefined); }}
              autoFocus
              error={tripNameError}
            />
          </View>

          {/* Feature List */}
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <View style={styles.featureIconWrap}>
                <Text style={styles.featureIcon}>⚡</Text>
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Smart Scanning</Text>
                <Text style={styles.featureDesc}>Only photos taken from this moment forward will be synced.</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconWrap}>
                <Text style={styles.featureIcon}>🤖</Text>
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>AI Delivery</Text>
                <Text style={styles.featureDesc}>Guests receive their personalized gallery via face recognition.</Text>
              </View>
            </View>
          </View>

          {/* CTA */}
          <PrimaryButton
            title={loading ? 'Creating...' : 'Launch Trip Session'}
            onPress={handleCreate}
            disabled={!tripName.trim() || loading}
            loading={loading}
            style={styles.submitBtn}
          />

        </Animated.View>
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 40,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backIcon: {
    fontSize: 20,
    color: colors.textPrimary,
  },
  preTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -1,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  form: {
    marginBottom: 32,
  },
  featureList: {
    gap: 24,
    marginBottom: 48,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  featureIcon: {
    fontSize: 20,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  submitBtn: {
    marginTop: 8,
  },
});
