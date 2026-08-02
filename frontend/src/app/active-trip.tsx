import { API_BASE_URL, GUEST_WEBAPP_URL } from '../config/api';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Alert, SafeAreaView,
  ScrollView, Animated, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useAuth } from '../context/AuthContext';
import {
  cancelAllUploadReminders,
  notifyTripEnded,
  notifyUploadComplete,
} from '../services/NotificationService';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

const StatCard = ({ value, label, icon }: { value: string | number; label: string; icon: string }) => (
  <View style={styles.statCard}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

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

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

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

              // Cancel all upload reminders and confirm to user
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

    // ─────────────────────────────────────────────────────────────────
    // NOTE ON PHOTO ACCESS IN EXPO GO
    // expo-media-library's automatic scanning (reading all photos since
    // trip start) requires a Development Build on Android 13+ because
    // Expo Go cannot declare READ_MEDIA_IMAGES in its manifest.
    //
    // We use expo-image-picker here instead — it shows the system photo
    // picker which always works in Expo Go. The user selects photos
    // manually. All upload logic is identical.
    //
    // To restore auto-scan: run `eas build --profile development`
    // and switch back to the MediaLibrary.getAssetsAsync() approach.
    // ─────────────────────────────────────────────────────────────────

    // 1. Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'FastSend needs access to your photos to upload them. Please enable it in Settings.',
        [{ text: 'OK' }]
      );
      return;
    }

    // 2. Open photo picker — allow multiple selection
    let pickerResult;
    try {
      pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 1, // We'll compress ourselves below
        exif: false,
        orderedSelection: true,
      });
    } catch (pickerErr) {
      Alert.alert('Error', 'Could not open photo picker. Please try again.');
      return;
    }

    if (pickerResult.canceled || pickerResult.assets.length === 0) {
      return; // User dismissed picker — silent exit, no error
    }

    const selectedAssets = pickerResult.assets;

    setUploading(true);
    setUploadProgress(0);
    setTotalToUpload(selectedAssets.length);
    setUploadErrors([]);

    const localErrors: string[] = [];
    let successCount = 0;

    try {
      // 3. Upload loop — identical to the auto-scan version
      for (let i = 0; i < selectedAssets.length; i++) {
        const asset = selectedAssets[i];
        setUploadProgress(i + 1);

        const fileName = asset.fileName || `photo_${Date.now()}_${i}.jpg`;

        try {
          // 3a. Compress to 1080px wide JPEG at 70% quality
          let manipResult;
          try {
            manipResult = await ImageManipulator.manipulateAsync(
              asset.uri,
              [{ resize: { width: 1080 } }],
              { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
            );
          } catch (compressErr) {
            localErrors.push(`"${fileName}" could not be compressed — skipped.`);
            continue;
          }

          // 3b. Build multipart form
          const formData = new FormData();
          formData.append('file', {
            uri: manipResult.uri,
            name: fileName,
            type: 'image/jpeg',
          } as any);
          // Use URI as device_local_id for idempotency
          formData.append('device_local_id', asset.uri);

          // 3c. Upload with 30s timeout
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

          // 3d. Handle response
          if (uploadRes.status === 400) {
            const body = await uploadRes.json().catch(() => ({}));
            localErrors.push(`"${fileName}": ${body.detail || 'Invalid photo format'}`);
          } else if (uploadRes.status === 404) {
            throw new Error('This trip no longer exists on the server.');
          } else if (!uploadRes.ok) {
            const body = await uploadRes.json().catch(() => ({}));
            localErrors.push(`"${fileName}": Upload failed (${uploadRes.status}) — ${body.detail || 'please try again'}`);
          } else {
            // 202 Accepted — success
            successCount++;
          }

        } catch (assetErr: any) {
          if (assetErr.message?.includes('no longer exists')) throw assetErr;
          localErrors.push(`"${fileName}": Unexpected error — skipped.`);
        }
      }

      setUploadErrors(localErrors);

      // 4. Summary
      if (localErrors.length === 0) {
        Alert.alert('Upload Complete ✓', `${successCount} photo${successCount !== 1 ? 's' : ''} pushed successfully!`);
      } else {
        Alert.alert(
          `Uploaded ${successCount}/${selectedAssets.length}`,
          `${localErrors.length} photo${localErrors.length > 1 ? 's' : ''} had issues:\n\n${localErrors.slice(0, 3).join('\n')}${localErrors.length > 3 ? `\n...and ${localErrors.length - 3} more.` : ''}`,
          [{ text: 'OK' }]
        );
      }
      if (successCount > 0) {
        notifyUploadComplete(successCount).catch(() => {});
      }

    } catch (e: any) {
      Alert.alert('Upload Failed', e.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const qrValue = inviteCode ? `${GUEST_WEBAPP_URL}/join/${inviteCode}` : 'loading';
  const uploadLabel = uploading
    ? `Uploading ${uploadProgress} / ${totalToUpload}...`
    : 'Push Photos Now';

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.livePill}>
              <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
            <Text style={styles.heading}>Active Trip</Text>
            <Text style={styles.subtitle}>Share the QR code with your guests</Text>
          </View>

          {/* QR Card */}
          <View style={styles.qrCard}>
            {tripError ? (
              <View style={styles.qrErrorState}>
                <Text style={styles.qrErrorText}>{tripError}</Text>
              </View>
            ) : inviteCode ? (
              <>
                <View style={styles.qrWrapper}>
                  <QRCode value={qrValue} size={180} color={colors.bg} backgroundColor="#FFFFFF" />
                </View>
                <View style={styles.codeRow}>
                  <Text style={styles.codeLabel}>INVITE CODE</Text>
                  <Text style={styles.codeValue}>{inviteCode}</Text>
                </View>
              </>
            ) : (
              <View style={styles.qrLoading}>
                <Text style={styles.qrLoadingText}>Generating QR...</Text>
              </View>
            )}
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <StatCard value={guests} label="Guests" icon="👥" />
            <StatCard value={photos} label="Photos" icon="📸" />
          </View>

          {/* Upload errors display */}
          {uploadErrors.length > 0 && (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxTitle}>⚠️ {uploadErrors.length} upload issue{uploadErrors.length > 1 ? 's' : ''}</Text>
              {uploadErrors.slice(0, 2).map((e, i) => (
                <Text key={i} style={styles.errorBoxItem}>• {e}</Text>
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
    gap: spacing.xs,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.successLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  liveText: {
    fontSize: typography.size.xs,
    fontWeight: '700',
    color: colors.success,
    letterSpacing: 1.5,
  },
  heading: {
    fontSize: typography.size.xxl,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  qrCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.lg,
  },
  qrWrapper: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
  },
  qrLoading: {
    height: 212,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrLoadingText: {
    color: colors.textMuted,
    fontSize: typography.size.sm,
  },
  qrErrorState: {
    height: 212,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrErrorText: {
    color: colors.error,
    fontSize: typography.size.base,
    textAlign: 'center',
  },
  codeRow: {
    alignItems: 'center',
    gap: 4,
  },
  codeLabel: {
    fontSize: typography.size.xs,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 2,
  },
  codeValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 6,
    fontFamily: 'monospace',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  statIcon: { fontSize: 22 },
  statValue: {
    fontSize: typography.size.xl,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: colors.errorLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.error + '30',
    gap: 4,
  },
  errorBoxTitle: {
    fontSize: typography.size.sm,
    fontWeight: '700',
    color: colors.error,
    marginBottom: 4,
  },
  errorBoxItem: {
    fontSize: typography.size.xs,
    color: colors.error,
    lineHeight: 18,
  },
  errorBoxMore: {
    fontSize: typography.size.xs,
    color: colors.error,
    fontStyle: 'italic',
    marginTop: 2,
  },
  actions: {
    gap: 0,
  },
});
