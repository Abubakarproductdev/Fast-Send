import { API_BASE_URL, GUEST_WEBAPP_URL } from '../config/api';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import * as MediaLibrary from 'expo-media-library';
import * as ImageManipulator from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { cancelAllUploadReminders, notifyTripEnded, notifyUploadComplete } from '../services/NotificationService';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenShell } from '../components/ScreenShell';
import { useTheme } from '../context/ThemeContext';
import { radius } from '../theme/spacing';
import { getCachedOrganizerSettings, OrganizerSettings } from '../services/OrganizerSettingsService';
import { checkUploadNetwork } from '../services/UploadNetworkService';

const StatItem = ({ value, label, icon }: { value: string | number; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }) => {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return <View style={styles.statItem}><Ionicons name={icon} size={17} color={colors.primaryDark} /><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
};

export default function ActiveTripScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { activeTripId, organizerId, setActiveTripId, tripStartTime, setTripStartTime } = useAuth();
  const [organizerSettings, setOrganizerSettings] = useState<OrganizerSettings>({ sync_interval_hours: 2, upload_mode: 'wifi_only' });
  const [inviteCode, setInviteCode] = useState<string | null>(null); const [guests, setGuests] = useState(0); const [photos, setPhotos] = useState(0); const [tripError, setTripError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false); const [uploadProgress, setUploadProgress] = useState(0); const [totalToUpload, setTotalToUpload] = useState(0); const [uploadErrors, setUploadErrors] = useState<string[]>([]); const [ending, setEnding] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current; const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    const pulse = Animated.loop(Animated.sequence([Animated.timing(pulseAnim, { toValue: 1.12, duration: 900, useNativeDriver: true }), Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true })])); pulse.start(); return () => pulse.stop();
  }, []);

  useEffect(() => { getCachedOrganizerSettings(organizerId).then(setOrganizerSettings).catch(() => {}); }, [organizerId]);

  useEffect(() => {
    const loadStats = async () => {
      if (!activeTripId) return;
      try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/api/v1/trips/${activeTripId}`, {}, 8000);
        if (response.status === 404) { setTripError('This trip no longer exists.'); return; }
        if (!response.ok) return;
        const data = await response.json(); setInviteCode(data.invite_code); setGuests(data.attendee_count ?? 0); setPhotos(data.media_count ?? 0); setTripError(null);
      } catch (e) {}
    };
    loadStats(); const interval = setInterval(loadStats, 5000); return () => clearInterval(interval);
  }, [activeTripId]);

  const handleEndTrip = () => Alert.alert('End session', 'Are you sure you want to end this trip? Guests will no longer be able to register.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'End trip', style: 'destructive', onPress: async () => {
      if (!activeTripId) return; setEnding(true);
      try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/api/v1/trips/${activeTripId}/end`, { method: 'POST' }, 10000);
        if (!response.ok) { const body = await response.json().catch(() => ({})); Alert.alert('Error', body.detail || 'Failed to end trip'); return; }
        await setActiveTripId(null); await setTripStartTime(null); await cancelAllUploadReminders(); notifyTripEnded().catch(() => {}); router.replace('/(tabs)');
      } catch (e) { Alert.alert('Error', 'Network error ending trip'); } finally { setEnding(false); }
    } },
  ]);

  const handlePushPhotos = async () => {
    if (!activeTripId || !tripStartTime) return;
    const networkCheck = await checkUploadNetwork(organizerSettings.upload_mode);
    if (!networkCheck.allowed) { Alert.alert('Upload unavailable', networkCheck.reason); return; }
    const { status } = await MediaLibrary.requestPermissionsAsync(false, ['photo'] as any);
    if (status !== 'granted') { Alert.alert('Permission required', 'FastSend needs photo access to upload.'); return; }
    setUploading(true); setUploadProgress(0); setUploadErrors([]);
    try {
      let normalizedTime = tripStartTime.trim(); if (!normalizedTime.endsWith('Z') && !normalizedTime.includes('+')) normalizedTime += 'Z'; const tripStartMs = new Date(normalizedTime).getTime() - 5000;
      let allAssets: MediaLibrary.Asset[] = []; let hasNextPage = true; let after: string | undefined = undefined;
      while (hasNextPage) { const result = await MediaLibrary.getAssetsAsync({ mediaType: ['photo'], createdAfter: tripStartMs, after, first: 100 }); allAssets = allAssets.concat(result.assets); hasNextPage = result.hasNextPage; after = result.endCursor; }
      const syncedKey = `syncedPhotos_${activeTripId}`; const stored = await AsyncStorage.getItem(syncedKey); const syncedIds: string[] = stored ? JSON.parse(stored) : []; const syncedSet = new Set(syncedIds); const unsyncedAssets = allAssets.filter(a => !syncedSet.has(a.id));
      if (unsyncedAssets.length === 0) { Alert.alert('All synced', 'No new photos found.'); setUploading(false); return; }
      setTotalToUpload(unsyncedAssets.length); const localErrors: string[] = []; let successCount = 0; const batchId = `batch_${Date.now()}`;
      for (let i = 0; i < unsyncedAssets.length; i++) {
        const asset = unsyncedAssets[i]; setUploadProgress(i + 1);
        try {
          const manipResult = await ImageManipulator.manipulateAsync(asset.uri, [{ resize: { width: 1080 } }], { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG });
          const formData = new FormData(); formData.append('file', { uri: manipResult.uri, name: asset.filename || 'photo.jpg', type: 'image/jpeg' } as any); formData.append('device_local_id', asset.id); formData.append('batch_id', batchId);
          const uploadRes = await fetchWithTimeout(`${API_BASE_URL}/api/v1/trips/${activeTripId}/media`, { method: 'POST', body: formData, headers: { Accept: 'application/json' } }, 30000);
          if (uploadRes.ok) { syncedIds.push(asset.id); successCount++; await AsyncStorage.setItem(syncedKey, JSON.stringify(syncedIds)); } else localErrors.push(`Failed: ${asset.filename}`);
        } catch (e) { localErrors.push(`Error: ${asset.filename}`); }
      }
      if (successCount > 0) { await fetchWithTimeout(`${API_BASE_URL}/api/v1/trips/${activeTripId}/batches/${batchId}/finalize`, { method: 'POST' }, 5000).catch(() => {}); notifyUploadComplete(successCount).catch(() => {}); }
      setUploadErrors(localErrors); Alert.alert('Sync complete', `Successfully pushed ${successCount} photos.`);
    } catch (e) { Alert.alert('Error', 'Sync failed'); } finally { setUploading(false); }
  };

  const qrValue = inviteCode ? new URL(`?trip=${encodeURIComponent(inviteCode)}`, GUEST_WEBAPP_URL).toString() : 'loading';

  return (
    <ScreenShell>
      <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.topBar}><TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={19} color={colors.textPrimary} /></TouchableOpacity><View style={styles.livePill}><Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} /><Text style={styles.liveText}>LIVE SESSION</Text></View><View style={styles.topSpacer} /></View>
          <View style={styles.header}><Text style={styles.eyebrow}>SHARE THE ROOM</Text><Text style={styles.title}>Your collection is live.</Text><Text style={styles.subtitle}>Guests scan this code to join the moment and receive their photos.</Text></View>
          <View style={styles.qrCard}>
            {tripError ? <View style={styles.errorState}><Ionicons name="alert-circle-outline" size={30} color={colors.error} /><Text style={styles.errorText}>{tripError}</Text></View> : inviteCode ? <><View style={styles.qrWrapper}><QRCode value={qrValue} size={184} color={colors.ink} backgroundColor="#FFFFFF" /></View><Text style={styles.inviteLabel}>INVITE CODE</Text><Text style={styles.inviteValue}>{inviteCode}</Text></> : <View style={styles.loadingState}><Ionicons name="hourglass-outline" size={24} color={colors.primaryDark} /><Text style={styles.loadingText}>Preparing your code…</Text></View>}
          </View>
          <View style={styles.metricsRow}><StatItem value={guests} label="GUESTS" icon="people-outline" /><View style={styles.metricDivider} /><StatItem value={photos} label="PHOTOS" icon="images-outline" /></View>
          {uploading && <View style={styles.progressBox}><View style={styles.progressHeader}><Text style={styles.progressText}>Syncing photos</Text><Text style={styles.progressCount}>{uploadProgress} / {totalToUpload}</Text></View><View style={styles.progressBar}><View style={[styles.progressFill, { width: `${(uploadProgress / totalToUpload) * 100}%` }]} /></View></View>}
          {uploadErrors.length > 0 && <View style={styles.errorBox}><Text style={styles.errorBoxTitle}>{uploadErrors.length} upload issue{uploadErrors.length > 1 ? 's' : ''}</Text>{uploadErrors.slice(0, 2).map((e, i) => <Text key={i} style={styles.errorBoxItem}>• {e}</Text>)}</View>}
          <View style={styles.actions}><PrimaryButton title={uploading ? 'Syncing...' : 'Push new photos'} onPress={handlePushPhotos} disabled={uploading || ending} loading={uploading} /><PrimaryButton title={ending ? 'Ending...' : 'End session'} type="secondary" onPress={handleEndTrip} disabled={uploading || ending} loading={ending} /></View>
        </ScrollView>
      </Animated.View>
    </ScreenShell>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  inner: { flex: 1 }, scroll: { paddingTop: 14, paddingBottom: 110 }, topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }, topSpacer: { width: 42 }, backBtn: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.successLight, paddingHorizontal: 11, paddingVertical: 8, borderRadius: radius.full }, liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success }, liveText: { color: colors.success, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  header: { marginBottom: 24 }, eyebrow: { color: colors.primaryDark, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 10 }, title: { color: colors.textPrimary, fontSize: 33, lineHeight: 38, fontWeight: '800', letterSpacing: -0.8, marginBottom: 9 }, subtitle: { color: colors.textSecondary, fontSize: 15, lineHeight: 21 },
  qrCard: { backgroundColor: colors.sageDark, borderRadius: radius.xl, minHeight: 326, padding: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }, qrWrapper: { backgroundColor: '#FFFFFF', padding: 15, borderRadius: 22, marginBottom: 18 }, inviteLabel: { color: colors.primaryLight, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 5 }, inviteValue: { color: colors.paper, fontSize: 28, fontWeight: '900', letterSpacing: 4 }, loadingState: { alignItems: 'center', gap: 10 }, loadingText: { color: 'rgba(255,253,248,0.7)', fontSize: 14 }, errorState: { alignItems: 'center', gap: 12, paddingHorizontal: 20 }, errorText: { color: colors.paper, textAlign: 'center', fontSize: 14 },
  metricsRow: { flexDirection: 'row', backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingVertical: 17, marginBottom: 24 }, statItem: { flex: 1, alignItems: 'center', gap: 5 }, statValue: { color: colors.textPrimary, fontSize: 24, fontWeight: '800' }, statLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '900', letterSpacing: 1 }, metricDivider: { width: 1, backgroundColor: colors.divider },
  progressBox: { backgroundColor: colors.paper, borderRadius: radius.md, padding: 15, borderWidth: 1, borderColor: colors.border, marginBottom: 14 }, progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }, progressText: { color: colors.textPrimary, fontSize: 13, fontWeight: '800' }, progressCount: { color: colors.primaryDark, fontSize: 12, fontWeight: '800' }, progressBar: { height: 7, backgroundColor: colors.bgElevated, borderRadius: 4, overflow: 'hidden' }, progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 }, errorBox: { backgroundColor: colors.errorLight, borderRadius: radius.md, padding: 14, marginBottom: 14 }, errorBoxTitle: { color: colors.error, fontSize: 13, fontWeight: '800', marginBottom: 5 }, errorBoxItem: { color: colors.error, fontSize: 12, lineHeight: 18 }, actions: { gap: 2 },
});
