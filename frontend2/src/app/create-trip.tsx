import { API_BASE_URL } from '../config/api';
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Alert, ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { scheduleUploadReminders } from '../services/NotificationService';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius, shadows } from '../theme/spacing';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const INFO_ROWS: { icon: IoniconName; title: string; desc: string }[] = [
  {
    icon: 'flash',
    title: 'Smart photo scanning',
    desc: 'Only photos taken after this trip starts will be uploaded.',
  },
  {
    icon: 'notifications',
    title: 'Reminders every 2 hours',
    desc: "We'll nudge you to push new photos so guests don't miss a moment.",
  },
  {
    icon: 'scan',
    title: 'AI face matching',
    desc: 'Each guest automatically receives only the photos they appear in.',
  },
];

export default function CreateTripScreen() {
  const router = useRouter();
  const { organizerId, setActiveTripId, setTripStartTime } = useAuth();
  const [tripName, setTripName] = useState('');
  const [loading, setLoading] = useState(false);
  const [tripNameError, setTripNameError] = useState<string | undefined>();

  const opacity = useSharedValue(0);
  const ty = useSharedValue(30);
  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
    ty.value = withSpring(0, { damping: 22, stiffness: 200 });
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

      // CRITICAL: Use device clock (not server) to avoid timezone/clock-skew issues
      const deviceStartTime = new Date().toISOString();

      await setActiveTripId(trip.id);
      await setTripStartTime(deviceStartTime);

      // Schedule reminders in background — don't block navigation
      scheduleUploadReminders().catch(e =>
        console.warn('[CreateTrip] Could not schedule reminders:', e)
      );

      router.replace('/active-trip');
    } catch (e: any) {
      Alert.alert('Could Not Create Trip', e.message, [{ text: 'OK' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Subtle glow */}
      <LinearGradient
        colors={['rgba(196,241,53,0.04)', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={animStyle}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
            <View style={styles.logoBadge}>
              <View style={styles.logoIcon}>
                <LinearGradient
                  colors={['rgba(196,241,53,0.18)', 'rgba(196,241,53,0.06)']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <Ionicons name="camera" size={18} color={colors.lime} />
              </View>
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
              iconName="pricetag-outline"
            />
          </View>

          {/* Info block */}
          <View style={styles.infoBlock}>
            {INFO_ROWS.map((row, i) => (
              <View key={i} style={styles.infoRow}>
                <View style={styles.infoIconWrap}>
                  <Ionicons name={row.icon} size={18} color={colors.lime} />
                </View>
                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoTitle}>{row.title}</Text>
                  <Text style={styles.infoDesc}>{row.desc}</Text>
                </View>
              </View>
            ))}
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
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(196,241,53,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  appName: {
    fontSize: typography.size.base,
    fontFamily: typography.fontBold,
    color: colors.textPrimary,
  },
  headingBlock: {
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  heading: {
    fontSize: typography.size.xxl,
    fontFamily: typography.fontExtraBold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.size.base,
    fontFamily: typography.fontRegular,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadows.sm,
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
    borderRadius: radius.sm,
    backgroundColor: colors.limeGlow,
    borderWidth: 1,
    borderColor: 'rgba(196,241,53,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  infoTextWrap: { flex: 1, gap: 2 },
  infoTitle: {
    fontSize: typography.size.base,
    fontFamily: typography.fontSemiBold,
    color: colors.textPrimary,
  },
  infoDesc: {
    fontSize: typography.size.sm,
    fontFamily: typography.fontRegular,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
