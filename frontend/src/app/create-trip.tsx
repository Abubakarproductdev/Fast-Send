import { API_BASE_URL } from '../config/api';
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Alert, Animated, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';

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
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, bounciness: 6, speed: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleCreate = async () => {
    if (!tripName.trim()) {
      setTripNameError('Please give your trip a name');
      return;
    }
    if (!organizerId) {
      Alert.alert('Session Error', 'You are not logged in. Please sign in again.', [
        { text: 'Sign In', onPress: () => router.replace('/login') },
      ]);
      return;
    }

    setLoading(true);
    try {
      let response;
      try {
        response = await fetch(`${API_BASE_URL}/api/v1/trips`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ organizer_id: organizerId }),
        });
      } catch {
        throw new Error('Cannot reach server. Check your network and try again.');
      }

      if (response.status === 422) {
        throw new Error('Invalid data sent to server. Please try again.');
      }
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.detail || `Failed to create trip (${response.status})`);
      }

      const trip = await response.json();
      if (!trip.id) throw new Error('Server returned an invalid trip. Please try again.');

      await setActiveTripId(trip.id);
      await setTripStartTime(trip.created_at);

      router.replace('/active-trip');
    } catch (e: any) {
      Alert.alert('Could Not Create Trip', e.message, [{ text: 'OK' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <View style={styles.logoBadge}>
              <Text style={styles.logoIcon}>📷</Text>
              <Text style={styles.appName}>FastSend</Text>
            </View>
          </View>

          {/* Heading */}
          <View style={styles.headingBlock}>
            <Text style={styles.heading}>New Trip</Text>
            <Text style={styles.subtitle}>Give it a name so you can find it later</Text>
          </View>

          {/* Input Card */}
          <View style={styles.card}>
            <InputField
              label="Trip Name"
              placeholder="e.g. Ahmed's Wedding"
              value={tripName}
              onChangeText={(t) => { setTripName(t); setTripNameError(undefined); }}
              autoFocus
              error={tripNameError}
              icon="🏷️"
            />
          </View>

          {/* Info block */}
          <View style={styles.infoBlock}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}><Text>⚡</Text></View>
              <View style={styles.infoTextWrap}>
                <Text style={styles.infoTitle}>Smart photo scanning</Text>
                <Text style={styles.infoDesc}>Only photos taken after this trip starts will be uploaded.</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}><Text>🔔</Text></View>
              <View style={styles.infoTextWrap}>
                <Text style={styles.infoTitle}>Reminders every 2 hours</Text>
                <Text style={styles.infoDesc}>We'll nudge you to push new photos so guests don't miss a moment.</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}><Text>🤖</Text></View>
              <View style={styles.infoTextWrap}>
                <Text style={styles.infoTitle}>AI face matching</Text>
                <Text style={styles.infoDesc}>Each guest automatically receives only the photos they appear in.</Text>
              </View>
            </View>
          </View>

          {/* CTA */}
          <PrimaryButton
            title="Create Trip & Get QR Code"
            onPress={handleCreate}
            disabled={!tripName.trim()}
            loading={loading}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: 0,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  backBtn: {
    padding: spacing.xs,
  },
  backIcon: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  logoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoIcon: { fontSize: 20 },
  appName: {
    fontSize: typography.size.base,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headingBlock: {
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  heading: {
    fontSize: typography.size.xxl,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  infoBlock: {
    marginBottom: spacing.xl,
    gap: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  infoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.amberGlow,
    borderWidth: 1,
    borderColor: colors.amber + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextWrap: { flex: 1, gap: 2 },
  infoTitle: {
    fontSize: typography.size.base,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  infoDesc: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
