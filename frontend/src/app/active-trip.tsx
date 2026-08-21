import { API_BASE_URL, GUEST_WEBAPP_URL } from '../config/api';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Alert,
  ScrollView, Animated, TouchableOpacity,
} from 'react-native';
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
import { ScreenShell } from '../components/ScreenShell';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

const StatItem = ({ value, label }: { value: string | number; label: string }) => (
  <View style={styles.statItem}>
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
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
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
        if (!response.ok) return;
        const data = await response.json();
        setInviteCode(data.invite_code);
        setGuests(data.attendee_count ?? 0);
        setPhotos(data.media_count ?? 0);
        setTripError(null);
      } catch (e) {}
    };
    loadStats();
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, [activeTripId]);

  const handleEndTrip = () => {
    Alert.alert(
      'End Session',
      "Are you sure you want to end this trip? Guests will no longer be able to register.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Trip',
          style: 'destructive',
          onPress: async () => {
            if (!activeTripId) return;
            setEnding(true);
            try {
              const response = await fetchWithTimeout(
                `${API_BASE_URL}/api/v1/trips/${activeTripId}/end`,
                { method: 'POST' },
                10000
              );
              if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                Alert.alert('Error', body.detail || 'Failed to end trip');
                return;
              }
              await setActiveTripId(null);
              await setTripStartTime(null);
              await cancelAllUploadReminders();
              notifyTripEnded().catch(() => {});
              router.replace('/(tabs)');
            } catch (e) {
              Alert.alert('Error', 'Network error ending trip');
            } finally {
              setEnding(false);
            }
          },
        },
      ]
    );
  };

  const handlePushPhotos = async () => {
    if (!activeTripId || !tripStartTime) return;

    const { status } = await MediaLibrary.requestPermissionsAsync(false, ['photo'] as any);
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'FastSend needs photo access to upload.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadErrors([]);

    try {
      let normalizedTime = tripStartTime.trim();
      if (!normalizedTime.endsWith('Z') && !normalizedTime.includes('+')) normalizedTime += 'Z';
      const tripStartMs = new Date(normalizedTime).getTime() - 5_000;

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
      const stored = await AsyncStorage.getItem(syncedKey);
      const syncedIds: string[] = stored ? JSON.parse(stored) : [];
      const syncedSet = new Set(syncedIds);
      const unsyncedAssets = allAssets.filter(a => !syncedSet.has(a.id));

      if (unsyncedAssets.length === 0) {
        Alert.alert('All Sync\'d', 'No new photos found.');
        setUploading(false);
        return;
      }

      setTotalToUpload(unsyncedAssets.length);
      const localErrors: string[] = [];
      let successCount = 0;
      const batchId = `batch_${Date.now()}`;

      for (let i = 0; i < unsyncedAssets.length; i++) {
        const asset = unsyncedAssets[i];
        setUploadProgress(i + 1);
        try {
          const manipResult = await ImageManipulator.manipulateAsync(
            asset.uri,
            [{ resize: { width: 1080 } }],
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
          );
          const formData = new FormData();
          formData.append('file', {
            uri: manipResult.uri,
            name: asset.filename || 'photo.jpg',
            type: 'image/jpeg',
          } as any);
          formData.append('device_local_id', asset.id);
          formData.append('batch_id', batchId);

          const uploadRes = await fetchWithTimeout(
            `${API_BASE_URL}/api/v1/trips/${activeTripId}/media`,
            { method: 'POST', body: formData, headers: { Accept: 'application/json' } },
            30000
          );

          if (uploadRes.ok) {
            syncedIds.push(asset.id);
            successCount++;
            await AsyncStorage.setItem(syncedKey, JSON.stringify(syncedIds));
          } else {
            localErrors.push(`Failed: ${asset.filename}`);
          }
        } catch (e) {
          localErrors.push(`Error: ${asset.filename}`);
        }
      }

      if (successCount > 0) {
        await fetchWithTimeout(`${API_BASE_URL}/api/v1/trips/${activeTripId}/batches/${batchId}/finalize`, { method: 'POST' }, 5000).catch(()=>{});
        notifyUploadComplete(successCount).catch(() => {});
      }

      setUploadErrors(localErrors);
      Alert.alert('Sync Complete', `Successfully pushed ${successCount} photos.`);
    } catch (e) {
      Alert.alert('Error', 'Sync failed');
    } finally {
      setUploading(false);
    }
  };

  const qrValue = inviteCode ? `${GUEST_WEBAPP_URL}/?trip=${inviteCode}` : 'loading';

  return (
    <ScreenShell>
      <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          
          {/* Status Header */}
          <View style={styles.header}>
            <View style={styles.livePill}>
              <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
              <Text style={styles.liveText}>LIVE SESSION</Text>
            </View>
            <Text style={styles.title}>Active Trip</Text>
            <Text style={styles.subtitle}>Guests can scan the code to join your journey</Text>
          </View>

          {/* QR Section */}
          <View style={styles.qrContainer}>
            {tripError ? (
              <View style={styles.errorState}>
                <Text style={styles.errorText}>{tripError}</Text>
              </View>
            ) : inviteCode ? (
              <View style={styles.qrContent}>
                <View style={styles.qrWrapper}>
                  <QRCode value={qrValue} size={200} color={colors.bg} backgroundColor="#FFFFFF" />
                </View>
                <View style={styles.inviteRow}>
                  <Text style={styles.inviteLabel}>INVITE CODE</Text>
                  <Text style={styles.inviteValue}>{inviteCode}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.loadingState}>
                <Text style={styles.loadingText}>Initializing...</Text>
              </View>
            )}
          </View>

          {/* Metrics Section */}
          <View style={styles.metricsRow}>
            <StatItem value={guests} label="GUESTS" />
            <View style={styles.metricDivider} />
            <StatItem value={photos} label="PHOTOS" />
          </View>

          {/* Action Section */}
          <View style={styles.actions}>
            {uploading && (
              <View style={styles.progressBox}>
                <Text style={styles.progressText}>Syncing {uploadProgress} of {totalToUpload}...</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${(uploadProgress/totalToUpload)*100}%` }]} />
                </View>
              </View>
            )}

            <PrimaryButton
              title={uploading ? 'Syncing...' : 'Push New Photos'}
              onPress={handlePushPhotos}
              disabled={uploading || ending}
              loading={uploading}
            />
            
            <PrimaryButton
              title={ending ? 'Ending...' : 'End Session'}
              type="secondary"
              onPress={handleEndTrip}
              disabled={uploading || ending}
              loading={ending}
            />
          </View>

        </ScrollView>
      </Animated.View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  inner: { flex: 1 },
  scroll: { paddingBottom: 100 },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 8,
    marginBottom: 16,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.success,
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  qrContainer: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    marginBottom: 32,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    marginBottom: 24,
  },
  inviteRow: {
    alignItems: 'center',
  },
  inviteLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textGold,
    letterSpacing: 2,
    marginBottom: 4,
  },
  inviteValue: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    padding: 24,
    marginBottom: 40,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: 4,
    letterSpacing: 1,
  },
  metricDivider: {
    width: 1.5,
    backgroundColor: colors.border,
  },
  actions: {
    gap: 16,
  },
  progressBox: {
    marginBottom: 16,
  },
  progressText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.bgElevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  errorState: { padding: 20 },
  errorText: { color: colors.error, textAlign: 'center' },
  loadingState: { padding: 40 },
  loadingText: { color: colors.textMuted },
  qrContent: { alignItems: 'center', width: '100%' },
});
