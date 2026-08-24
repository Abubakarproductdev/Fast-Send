import { API_BASE_URL, GUEST_WEBAPP_URL } from '../config/api';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Alert, SafeAreaView,
  ScrollView, TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import * as MediaLibrary from 'expo-media-library';
import * as ImageManipulator from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import {
  cancelAllUploadReminders,
  notifyTripEnded,
  notifyUploadComplete,
} from '../services/NotificationService';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius, shadows } from '../theme/spacing';

// ─── Live Pill ────────────────────────────────────────────────────────────────
const LivePill = () => {
  const ringScale   = useSharedValue(1);
  const ringOpacity = useSharedValue(1);
  const dotScale    = useSharedValue(1);

  useEffect(() => {
    ringScale.value = withRepeat(
      withSequence(
        withTiming(2.6, { duration: 1400, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 0 }),
      ),
      -1,
    );
    ringOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1400, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 0 }),
      ),
      -1,
    );
    dotScale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 700, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.0, { duration: 700, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));
  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
  }));

  return (
    <View style={livePillStyles.container}>
      <View style={livePillStyles.dotWrap}>
        <Animated.View style={[livePillStyles.ring, ringStyle]} />
        <Animated.View style={[livePillStyles.dot, dotStyle]} />
      </View>
      <Text style={livePillStyles.text}>LIVE</Text>
    </View>
  );
};

const livePillStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.30)',
    alignSelf: 'flex-start',
  },
  dotWrap: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(34,197,94,0.6)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  text: {
    fontSize: typography.size.xs,  // 11px
    fontFamily: typography.fontExtraBold,
    color: colors.success,
    letterSpacing: 2,
  },
});

// ─── Stat card ────────────────────────────────────────────────────────────────
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const StatCard = ({
  value, label, iconName, delay,
}: {
  value: string | number;
  label: string;
  iconName: IoniconName;
  delay: number;
}) => {
  const opacity = useSharedValue(0);
  const ty = useSharedValue(16);
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) }));
    ty.value = withDelay(delay, withSpring(0, { damping: 22, stiffness: 200 }));
  }, []);

  return (
    <Animated.View style={[statStyles.card, style]}>
      <Ionicons name={iconName} size={20} color={colors.lime} />
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </Animated.View>
  );
};

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    height: 90,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    ...shadows.sm,
  },
  value: {
    fontSize: typography.size.xxl,  // 32px — big stat number
    fontFamily: typography.fontExtraBold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  label: {
    fontSize: typography.size.xs,
    fontFamily: typography.fontSemiBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ActiveTripScreen() {
  const router = useRouter();
  const { activeTripId, setActiveTripId, tripStartTime, setTripStartTime } = useAuth();

  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [guests, setGuests] = useState(0);
  const [photos, setPhotos] = useState(0);
  const [tripError, setTripError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [totalToUpload, setTotalToUpload] = useState(0);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [ending, setEnding] = useState(false);

  // Screen entrance
  const screenOpacity = useSharedValue(0);
  const screenTy = useSharedValue(20);
  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
    transform: [{ translateY: screenTy.value }],
  }));

  // QR card pop-in
  const qrScale = useSharedValue(0.88);
  const qrOpacity = useSharedValue(0);
  const qrStyle = useAnimatedStyle(() => ({
    transform: [{ scale: qrScale.value }],
    opacity: qrOpacity.value,
  }));

  useEffect(() => {
    screenOpacity.value = withTiming(1, { duration: 480, easing: Easing.out(Easing.cubic) });
    screenTy.value = withSpring(0, { damping: 22, stiffness: 200 });
  }, []);

  useEffect(() => {
    if (inviteCode) {
      qrScale.value = withDelay(80, withSpring(1, { damping: 18, stiffness: 180 }));
      qrOpacity.value = withDelay(80, withTiming(1, { duration: 250 }));
    }
  }, [inviteCode]);

  // Upload progress bar
  const progressWidth = uploading && totalToUpload > 0
    ? `${Math.round((uploadProgress / totalToUpload) * 100)}%` as any
    : '0%';

  useEffect(() => {
    const loadStats = async () => {
      if (!activeTripId) return;
      try {
        const response = await fetchWithTimeout(
          `${API_BASE_URL}/api/v1/trips/${activeTripId}`,
          {},
          8000
        );
        if (response.status === 404) {
          setTripError('This trip no longer exists.');
          return;
        }
        if (!response.ok) {
          console.warn('Failed to load stats:', response.status);
          return;
        }
        const data = await response.json();
        setInviteCode(data.invite_code);
        setGuests(data.attendee_count ?? 0);
        setPhotos(data.media_count ?? 0);
        setTripError(null);
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          console.error('Failed to load trip stats', e);
        }
      }
    };
    loadStats();
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, [activeTripId]);

  const handleEndTrip = () => {
    Alert.alert(
      'End Trip',
      "Are you sure? Guests won't be able to register or upload photos after this.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Trip',
          style: 'destructive',
          onPress: async () => {
            if (!activeTripId) return;
            setEnding(true);
            try {
              let response;
              try {
                response = await fetchWithTimeout(
                  `${API_BASE_URL}/api/v1/trips/${activeTripId}/end`,
                  { method: 'POST' },
                  10000
                );
              } catch {
                Alert.alert('Network Error', 'Could not reach the server. Please check your connection and try again.');
                return;
              }
              if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                Alert.alert('Error', body.detail || `Failed to end trip (${response.status})`);
                return;
              }
              await setActiveTripId(null);
              await setTripStartTime(null);
              await cancelAllUploadReminders();
              notifyTripEnded().catch(() => {});
              router.replace('/(tabs)');
            } catch (e: any) {
              Alert.alert('Error', 'Something went wrong ending the trip. Please try again.');
            } finally {
              setEnding(false);
            }
          },
        },
      ]
    );
  };

  const handlePushPhotos = async () => {
    if (!activeTripId) return;

    const { status } = await MediaLibrary.requestPermissionsAsync(false, ['photo'] as any);
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'FastSend needs access to your photos to upload them. Please enable it in Settings.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!tripStartTime) {
      Alert.alert(
        'Missing Trip Start Time',
        'Unable to determine when this trip started. Please end this trip and create a new one.'
      );
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadErrors([]);

    try {
      let normalizedTime = tripStartTime.trim();
      if (!normalizedTime.endsWith('Z') && !normalizedTime.includes('+')) {
        normalizedTime += 'Z';
      }
      const tripStartMs = new Date(normalizedTime).getTime() - 5_000;
      if (isNaN(tripStartMs)) {
        throw new Error('Invalid trip start time stored. Please end this trip and create a new one.');
      }

      let allAssets: MediaLibrary.Asset[] = [];
      let hasNextPage = true;
      let after: string | undefined = undefined;

      while (hasNextPage) {
        const result = await MediaLibrary.getAssetsAsync({
          mediaType: ['photo'],
          createdAfter: tripStartMs,
          after,
          first: 100,
        });
        allAssets = allAssets.concat(result.assets);
        hasNextPage = result.hasNextPage;
        after = result.endCursor;
      }

      const syncedKey = `syncedPhotos_${activeTripId}`;
      let syncedIds: string[] = [];
      try {
        const stored = await AsyncStorage.getItem(syncedKey);
        syncedIds = stored ? JSON.parse(stored) : [];
      } catch {
        syncedIds = [];
      }

      const syncedSet = new Set(syncedIds);
      const unsyncedAssets = allAssets.filter(a => !syncedSet.has(a.id));

      if (unsyncedAssets.length === 0) {
        Alert.alert('All caught up!', 'No new photos to push since your last sync.');
        setUploading(false);
        return;
      }

      setTotalToUpload(unsyncedAssets.length);

      const localErrors: string[] = [];
      let successCount = 0;
      const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      for (let i = 0; i < unsyncedAssets.length; i++) {
        const asset = unsyncedAssets[i];
        setUploadProgress(i + 1);

        const fileName = asset.filename || `photo_${Date.now()}.jpg`;

        try {
          let fileType = 'image/jpeg';
          const lowerName = fileName.toLowerCase();
          if (lowerName.endsWith('.heic')) fileType = 'image/heic';
          else if (lowerName.endsWith('.png')) fileType = 'image/png';

          const formData = new FormData();
          formData.append('file', {
            uri: asset.uri,
            name: fileName,
            type: fileType,
          } as any);
          formData.append('device_local_id', asset.id);
          formData.append('batch_id', batchId);

          let uploadRes;
          try {
            uploadRes = await fetchWithTimeout(
              `${API_BASE_URL}/api/v1/trips/${activeTripId}/media`,
              {
                method: 'POST',
                body: formData,
                headers: { Accept: 'application/json' },
              },
              30000
            );
          } catch (fetchErr: any) {
            if (fetchErr.name === 'AbortError') {
              localErrors.push(`"${fileName}" upload timed out — skipped.`);
            } else {
              localErrors.push(`Network error uploading "${fileName}" — skipped.`);
            }
            continue;
          }

          if (uploadRes.status === 400) {
            const body = await uploadRes.json().catch(() => ({}));
            localErrors.push(`"${fileName}": ${body.detail || 'Invalid photo format'}`);
          } else if (uploadRes.status === 404) {
            throw new Error('This trip no longer exists on the server.');
          } else if (!uploadRes.ok) {
            const body = await uploadRes.json().catch(() => ({}));
            localErrors.push(`"${fileName}": Upload failed (${uploadRes.status}) — ${body.detail || 'please try again'}`);
          } else {
            syncedIds.push(asset.id);
            successCount++;
          }

          await AsyncStorage.setItem(syncedKey, JSON.stringify(syncedIds));
        } catch (assetErr: any) {
          if (assetErr.message?.includes('no longer exists')) throw assetErr;
          localErrors.push(`Photo "${asset.filename || asset.id}": Unexpected error — skipped.`);
        }
      }

      // Finalize batch
      if (successCount > 0) {
        try {
          await fetchWithTimeout(
            `${API_BASE_URL}/api/v1/trips/${activeTripId}/batches/${batchId}/finalize`,
            {
              method: 'POST',
              headers: { Accept: 'application/json' },
            },
            10000
          );
        } catch {
          console.warn('Failed to trigger batch finalize hook, processing might be delayed.');
        }
      }

      setUploadErrors(localErrors);

      if (localErrors.length === 0) {
        Alert.alert('Upload Complete', `${successCount} photo${successCount !== 1 ? 's' : ''} pushed successfully!`);
        if (successCount > 0) notifyUploadComplete(successCount).catch(() => {});
      } else {
        Alert.alert(
          `Uploaded ${successCount}/${unsyncedAssets.length}`,
          `${localErrors.length} photo${localErrors.length > 1 ? 's' : ''} had issues:\n\n${localErrors.slice(0, 3).join('\n')}${localErrors.length > 3 ? `\n...and ${localErrors.length - 3} more.` : ''}`,
          [{ text: 'OK' }]
        );
        if (successCount > 0) notifyUploadComplete(successCount).catch(() => {});
      }
    } catch (e: any) {
      Alert.alert('Upload Failed', e.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Build the QR URL with URL instead of concatenating slashes.  The configured
  // deployment URL may already end in `/`; a doubled slash makes Vercel issue a
  // redirect before the guest app loads and is especially fragile in mobile QR
  // scanners/webviews.
  const qrValue = inviteCode
    ? new URL(`?trip=${encodeURIComponent(inviteCode)}`, GUEST_WEBAPP_URL).toString()
    : 'loading';
  const uploadLabel = uploading
    ? `Uploading ${uploadProgress} / ${totalToUpload}...`
    : 'Push Photos Now';

  return (
    <SafeAreaView style={styles.container}>
      {/* Subtle green tinted glow for live context */}
      <LinearGradient
        colors={['rgba(34,197,94,0.04)', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <Animated.View style={[styles.inner, screenStyle]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* Header */}
          <View style={styles.header}>
            <LivePill />
            <Text style={styles.heading}>Active Trip</Text>
            <Text style={styles.subtitle}>Share the QR code with your guests</Text>
          </View>

          {/* QR Card */}
          <Animated.View style={[styles.qrCard, qrStyle]}>
            {/* 3D shelf effect — subtle perspective tilt */}
            {tripError ? (
              <View style={styles.qrStateContainer}>
                <Ionicons name="warning" size={32} color={colors.error} />
                <Text style={styles.qrErrorText}>{tripError}</Text>
              </View>
            ) : inviteCode ? (
              <>
                <View style={styles.qrWrapper}>
                  <QRCode
                    value={qrValue}
                    size={188}
                    color="#000000"  // Must be pure black for reliable scanning
                    backgroundColor="#FFFFFF"  // Must be pure white for reliable scanning
                  />
                </View>
                <View style={styles.codeRow}>
                  <Text style={styles.codeLabel}>INVITE CODE</Text>
                  <Text style={styles.codeValue}>{inviteCode}</Text>
                </View>
              </>
            ) : (
              <View style={styles.qrStateContainer}>
                <Text style={styles.qrLoadingText}>Generating QR...</Text>
              </View>
            )}
          </Animated.View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <StatCard value={guests} label="Guests"  iconName="people"  delay={0} />
            <StatCard value={photos} label="Photos"  iconName="images"  delay={80} />
          </View>

          {/* Upload progress bar (shown while uploading) */}
          {uploading && totalToUpload > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
              </View>
              <Text style={styles.progressLabel}>
                {uploadProgress} of {totalToUpload} photos
              </Text>
            </View>
          )}

          {/* Upload errors */}
          {uploadErrors.length > 0 && (
            <View style={styles.errorBox}>
              <View style={styles.errorBoxHeader}>
                <Ionicons name="warning" size={14} color={colors.error} />
                <Text style={styles.errorBoxTitle}>
                  {uploadErrors.length} upload issue{uploadErrors.length > 1 ? 's' : ''}
                </Text>
              </View>
              {uploadErrors.slice(0, 2).map((e, i) => (
                <Text key={i} style={styles.errorBoxItem}>{'\u2022'} {e}</Text>
              ))}
              {uploadErrors.length > 2 && (
                <Text style={styles.errorBoxMore}>+{uploadErrors.length - 2} more</Text>
              )}
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <PrimaryButton
              title={uploadLabel}
              onPress={handlePushPhotos}
              disabled={uploading || !!tripError}
              loading={uploading}
            />
            <PrimaryButton
              title="End Trip"
              type="danger"
              onPress={handleEndTrip}
              disabled={ending || uploading}
              loading={ending}
            />
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: 8,
    marginTop: 40,
  },
  heading: {
    fontSize: typography.size.xxl,
    fontFamily: typography.fontExtraBold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginTop: 4,
  },
  subtitle: {
    fontSize: typography.size.sm,
    fontFamily: typography.fontRegular,
    color: colors.textSecondary,
  },

  // QR Card
  qrCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.lg,
    ...shadows.lg,
    // Subtle 3D perspective tilt
    transform: [{ perspective: 800 }, { rotateX: '1.5deg' }],
  },
  qrWrapper: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 14,
    // Inner shadow for QR tile depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 10,
    elevation: 6,
  },
  qrStateContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  qrLoadingText: {
    color: colors.textMuted,
    fontSize: typography.size.sm,
    fontFamily: typography.fontRegular,
  },
  qrErrorText: {
    color: colors.error,
    fontSize: typography.size.base,
    fontFamily: typography.fontMedium,
    textAlign: 'center',
    marginTop: 8,
  },
  codeRow: {
    alignItems: 'center',
    gap: 4,
  },
  codeLabel: {
    fontSize: typography.size.xs,
    fontFamily: typography.fontBold,
    color: colors.textMuted,
    letterSpacing: 3,
  },
  codeValue: {
    ...typography.monoCode,
    color: colors.lime,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },

  // Progress bar
  progressContainer: {
    marginBottom: spacing.md,
    gap: 6,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(196,241,53,0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.lime,
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: typography.size.xs,
    fontFamily: typography.fontRegular,
    color: colors.textMuted,
    textAlign: 'center',
  },

  // Error box
  errorBox: {
    backgroundColor: colors.errorLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.error + '30',
    gap: 4,
  },
  errorBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  errorBoxTitle: {
    fontSize: typography.size.sm,
    fontFamily: typography.fontBold,
    color: colors.error,
  },
  errorBoxItem: {
    fontSize: typography.size.xs,
    fontFamily: typography.fontRegular,
    color: colors.error,
    lineHeight: 18,
  },
  errorBoxMore: {
    fontSize: typography.size.xs,
    fontFamily: typography.fontRegular,
    color: colors.error,
    fontStyle: 'italic',
    marginTop: 2,
  },

  actions: {
    gap: spacing.xs,
  },
});
