import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import {
  ChevronLeft,
  Users,
  Image as ImageIcon,
  Upload,
  Flag,
  RotateCcw,
  BadgeCheck,
} from 'lucide-react-native';
import { GUEST_WEBAPP_URL } from '../config/api';
import { api, TripDetail, DownloadPermission } from '../services/api';
import { SyncService } from '../services/SyncService';
import { storage } from '../utils/storage';
import { getErrorMessage } from '../utils/errors';
import { useAuth } from '../context/AuthContext';
import { useTripModal } from '../context/TripModalContext';
import { cancelAllUploadReminders, notifyTripEnded } from '../services/NotificationService';
import { StatusBar } from '../components/StatusBar';
import { NeoSheet } from '../components/ui/NeoSheet';
import { NeoField } from '../components/ui/NeoField';
import { NeoInput } from '../components/ui/NeoInput';
import { NeoButton } from '../components/ui/NeoButton';
import { NeoToggle } from '../components/ui/NeoToggle';
import { useTheme } from '../theme/ThemeContext';

const PERMISSION_OPTIONS: { value: DownloadPermission; title: string; description: string }[] = [
  {
    value: 'mine',
    title: 'Download my photos',
    description: 'Guests see and download only solo photos where they appear.',
  },
  {
    value: 'mine_plus_group',
    title: 'My photos plus group photos',
    description: 'Guests get their photos and group moments they are in.',
  },
  {
    value: 'all',
    title: 'Download all photos',
    description: 'Guests see and download the complete trip collection.',
  },
];

const formatDate = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function TripDetailsScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { organizerId, activeTripId, setActiveTripId, tripStartTime, setTripStartTime } = useAuth();
  const { showToast } = useTripModal();
  const { colors, neoShadow } = useTheme();

  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [customName, setCustomName] = useState<string | null>(null);

  // Sheets
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Form drafts & busy flags
  const [nameDraft, setNameDraft] = useState('');
  const [deleteDraft, setDeleteDraft] = useState('');
  const [endBusy, setEndBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [reliveBusy, setReliveBusy] = useState(false);
  const [permissionSaving, setPermissionSaving] = useState(false);
  const [allowUploads, setAllowUploads] = useState(true);

  // Uploading state
  const [upload, setUpload] = useState<{ done: number; total: number } | null>(null);
  const [uploading, setUploading] = useState(false);

  // Live indicator pulse
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const loadRename = useCallback(async (id: string) => {
    const renames = await storage.getTripRenames();
    if (renames[id]) setCustomName(renames[id]);
  }, []);

  useEffect(() => {
    if (!tripId) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const refresh = async () => {
      try {
        const fresh = await api.getTrip(tripId);
        if (cancelled) return;
        setTrip(fresh);
        loadRename(tripId);
        if (!fresh.is_active) return;
        timer = setTimeout(refresh, 5000);
      } catch (err: any) {
        if (cancelled) return;
        if (err?.status === 404) {
          showToast('This trip no longer exists');
          router.back();
          return;
        }
        timer = setTimeout(refresh, 5000);
      } finally {
        setLoading(false);
      }
    };

    refresh();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [tripId, loadRename, router, showToast]);

  const live = trip?.is_active ?? false;
  const displayName = customName || trip?.name || 'Untitled Trip';
  const downloadPermission = trip?.settings?.download_permission || 'mine';

  const guestUrl = trip?.invite_code
    ? `${GUEST_WEBAPP_URL}?trip=${encodeURIComponent(trip.invite_code)}`
    : '';

  const handleSavePermission = async (val: DownloadPermission) => {
    if (!trip || !organizerId || permissionSaving || val === downloadPermission) return;
    const prevPermission = downloadPermission;
    setTrip((prev) => (prev ? { ...prev, settings: { ...prev.settings, download_permission: val } } : null));
    setPermissionSaving(true);
    try {
      const updated = await api.updateTripSettings(trip.id, organizerId, { download_permission: val });
      setTrip((prev) =>
        prev
          ? { ...prev, settings: { ...prev.settings, download_permission: updated.settings?.download_permission ?? val } }
          : null,
      );
      showToast('Download permission updated');
    } catch (err) {
      setTrip((prev) => (prev ? { ...prev, settings: { ...prev.settings, download_permission: prevPermission } } : null));
      showToast(getErrorMessage(err));
    } finally {
      setPermissionSaving(false);
    }
  };

  const handleSaveName = async () => {
    if (!trip) return;
    const next = nameDraft.trim();
    if (next && next !== displayName) {
      await storage.setTripRename(trip.id, next);
      setCustomName(next);
      showToast('Trip renamed');
    }
    setSettingsOpen(false);
  };

  const handlePushPhotos = async () => {
    if (!trip || uploading) return;
    const startTime = tripStartTime || trip.created_at;
    const quality = (await storage.getImageQuality()) || 'High (1080p)';
    const uploadMode = (await storage.getUploadMode()) || 'wifi_only';

    setUploading(true);
    setUpload({ done: 0, total: 1 });

    try {
      const result = await SyncService.pushPhotos(
        trip.id,
        startTime,
        uploadMode,
        quality,
        (current, total) => setUpload({ done: current, total }),
      );

      if (result.totalCount === 0) {
        showToast('All photos are already uploaded');
      } else if (result.errors.length === 0) {
        showToast(`${result.successCount} photo${result.successCount > 1 ? 's' : ''} uploaded`);
      } else {
        showToast(`${result.successCount} uploaded, ${result.errors.length} failed`);
      }

      const fresh = await api.getTrip(trip.id);
      setTrip(fresh);
    } catch (err) {
      showToast(getErrorMessage(err));
    } finally {
      setUpload(null);
      setUploading(false);
    }
  };

  const handleEndTrip = async () => {
    if (!trip) return;
    setEndBusy(true);
    try {
      await api.endTrip(trip.id);
      if (activeTripId === trip.id) {
        await setActiveTripId(null);
        await setTripStartTime(null);
        await cancelAllUploadReminders();
      }
      notifyTripEnded().catch(() => {});
      setTrip((prev) => (prev ? { ...prev, is_active: false } : null));
      setEndOpen(false);
      showToast('Trip ended');
    } catch (err) {
      showToast(getErrorMessage(err));
    } finally {
      setEndBusy(false);
    }
  };

  const handleReliveTrip = async () => {
    if (!trip || !organizerId) return;
    setReliveBusy(true);
    try {
      const reopened = await api.reliveTrip(trip.id, organizerId);
      const startedAt = new Date().toISOString();
      await setActiveTripId(reopened.id);
      await setTripStartTime(startedAt);
      setTrip((prev) => (prev ? { ...prev, is_active: true } : null));
      showToast('Trip is live again!');
    } catch (err) {
      showToast(getErrorMessage(err));
    } finally {
      setReliveBusy(false);
    }
  };

  const handleDeleteTrip = async () => {
    if (!trip || !organizerId || deleteDraft.trim().toUpperCase() !== 'DELETE') return;
    setDeleteBusy(true);
    try {
      await api.deleteTrip(trip.id, organizerId);
      if (activeTripId === trip.id) {
        await setActiveTripId(null);
        await setTripStartTime(null);
        await cancelAllUploadReminders();
      }
      setDeleteOpen(false);
      showToast('Trip deleted');
      router.replace('/(tabs)/archive');
    } catch (err) {
      showToast(getErrorMessage(err));
    } finally {
      setDeleteBusy(false);
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.cream },
    loadingContainer: {
      flex: 1,
      backgroundColor: colors.cream,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 24,
    },
    loadingText: { fontSize: 15, fontFamily: 'Nunito_700Bold', color: colors.mut },
    errorTitle: { fontSize: 20, fontFamily: 'Nunito_800ExtraBold', color: colors.ink },
    backBtnWrapper: {
      marginTop: 10,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 999,
      borderWidth: 2,
      borderColor: colors.ink,
      backgroundColor: colors.white,
    },
    backLinkText: { fontSize: 14, fontFamily: 'Nunito_800ExtraBold', color: colors.ink },
    scrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
    topBar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    backCircleBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      borderWidth: 2,
      borderColor: colors.ink,
      backgroundColor: colors.white,
      justifyContent: 'center',
      alignItems: 'center',
    },
    topTitleWrap: { flex: 1 },
    topTitle: { fontSize: 23, fontFamily: 'Nunito_900Black', color: colors.ink },
    topDate: { fontSize: 12, fontFamily: 'Nunito_700Bold', color: colors.mut, marginTop: 1 },
    statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999 },
    statusDot: { width: 7, height: 7, borderRadius: 4 },
    statusText: { fontSize: 10, fontFamily: 'Nunito_900Black', letterSpacing: 1.1 },
    introCopy: {
      fontSize: 14, fontFamily: 'Nunito_700Bold', lineHeight: 20,
      color: colors.textSecondary, marginTop: 12, marginBottom: 14,
    },
    qrCard: {
      backgroundColor: colors.leaf,
      borderRadius: 24, borderWidth: 1.5,
      borderTopWidth: 4, borderColor: colors.ink,
      padding: 22, alignItems: 'center', marginBottom: 14,
    },
    qrInnerBox: {
      backgroundColor: colors.white,
      borderRadius: 20, borderWidth: 2, borderColor: colors.ink,
      padding: 14, marginBottom: 18,
      justifyContent: 'center', alignItems: 'center',
    },
    qrShareLabel: {
      fontSize: 11, fontFamily: 'Nunito_900Black',
      letterSpacing: 1.8, color: 'rgba(248, 244, 233, 0.85)', marginBottom: 5,
    },
    qrInviteCode: {
      fontSize: 28, fontFamily: 'Nunito_900Black',
      letterSpacing: 3.5, color: colors.cream,
    },
    statsRow: {
      flexDirection: 'row', backgroundColor: colors.white,
      borderRadius: 20, borderWidth: 1.5,
      borderTopWidth: 4, borderColor: colors.ink,
      paddingVertical: 16, marginBottom: 14,
    },
    statCol: { flex: 1, alignItems: 'center', gap: 4 },
    statNumber: { fontSize: 23, fontFamily: 'Nunito_900Black', color: colors.ink },
    statLabel: { fontSize: 10, fontFamily: 'Nunito_900Black', letterSpacing: 1.2, color: colors.mut },
    statDivider: { width: 2, backgroundColor: 'rgba(16, 16, 16, 0.12)' },
    uploadProgressBox: {
      backgroundColor: colors.skySoft, borderRadius: 20,
      borderWidth: 1.5,
      borderTopWidth: 4, borderColor: colors.ink, padding: 16, marginBottom: 14,
    },
    progressHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    progressText: { fontSize: 13, fontFamily: 'Nunito_900Black', color: colors.ink },
    progressPercent: { fontSize: 12, fontFamily: 'Nunito_900Black', color: colors.textSecondary },
    progressTrack: {
      height: 11, borderRadius: 999, borderWidth: 2, borderColor: colors.ink,
      backgroundColor: colors.white, overflow: 'hidden', marginTop: 9,
    },
    progressFill: { height: '100%', backgroundColor: colors.sky, borderRadius: 999 },
    actionsContainer: { gap: 13, marginTop: 2 },
    actionBtnWhite: {
      width: '100%', borderRadius: 999, borderWidth: 2, borderColor: colors.ink,
      backgroundColor: colors.white, paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
    },
    actionBtnBrand: {
      width: '100%', borderRadius: 999, borderWidth: 2, borderColor: colors.ink,
      backgroundColor: colors.brand, paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
    },
    actionBtnTextInk: {
      fontSize: 14, fontFamily: 'Nunito_900Black', letterSpacing: 1.5, color: colors.ink,
    },
    actionBtnTextFlame: {
      fontSize: 14, fontFamily: 'Nunito_900Black', letterSpacing: 1.5, color: colors.flame,
    },
    reliveInnerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    btnDisabled: { opacity: 0.5 },
    endedDisclaimer: {
      textAlign: 'center', fontSize: 12, fontFamily: 'Nunito_700Bold', color: colors.mut, paddingBottom: 4,
    },
    sheetSectionLabel: {
      fontSize: 12, fontFamily: 'Nunito_900Black', letterSpacing: 1.4, color: colors.ink, marginBottom: 9,
    },
    permissionsList: { gap: 9, marginBottom: 18 },
    permissionCard: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      borderRadius: 16, borderWidth: 1.5,
      borderTopWidth: 4, borderColor: colors.ink, paddingHorizontal: 16, paddingVertical: 14,
    },
    permissionCardSelected: { backgroundColor: colors.brand },
    permissionCardUnselected: { backgroundColor: colors.white },
    permissionCardCopy: { flex: 1 },
    permissionTitle: { fontSize: 15, fontFamily: 'Nunito_900Black', color: colors.ink },
    permissionSub: { fontSize: 12, fontFamily: 'Nunito_700Bold', marginTop: 2, lineHeight: 16 },
    toggleRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      borderRadius: 16, borderWidth: 1.5,
      borderTopWidth: 4, borderColor: colors.ink,
      backgroundColor: colors.white, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 20,
    },
    toggleLabel: { fontSize: 15, fontFamily: 'Nunito_900Black', color: colors.ink },
    sheetActions: { gap: 11 },
    deleteBtnOutline: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
      borderRadius: 999, borderWidth: 2, borderColor: colors.flame,
      backgroundColor: colors.white, paddingVertical: 14,
    },
    deleteBtnOutlineText: { fontSize: 15, fontFamily: 'Nunito_900Black', color: colors.flame },
    infoBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 11,
      borderRadius: 16, borderWidth: 1.5,
      borderTopWidth: 4, borderColor: colors.ink,
      backgroundColor: colors.flameSoft, padding: 14, marginBottom: 16,
    },
    infoBannerText: { flex: 1, fontSize: 13, fontFamily: 'Nunito_700Bold', lineHeight: 18, color: colors.textSecondary },
    modalBtns: { marginTop: 7 },
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar />
        <ActivityIndicator size="large" color={colors.flame} />
        <Text style={styles.loadingText}>Loading trip details…</Text>
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar />
        <Text style={styles.errorTitle}>Trip not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnWrapper}>
          <Text style={styles.backLinkText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backCircleBtn, neoShadow]}
            activeOpacity={0.8}
            accessibilityLabel="Back"
          >
            <ChevronLeft size={21} strokeWidth={3} color={colors.ink} />
          </TouchableOpacity>

          <View style={styles.topTitleWrap}>
            <Text style={styles.topTitle} numberOfLines={1}>{displayName}</Text>
            <Text style={styles.topDate}>{formatDate(trip.created_at)}</Text>
          </View>

          <View style={[styles.statusPill, { backgroundColor: live ? colors.leafSoft : colors.creamDeep }]}>
            <Animated.View
              style={[
                styles.statusDot,
                { backgroundColor: live ? colors.leaf : colors.mut, transform: live ? [{ scale: pulseAnim }] : [] },
              ]}
            />
            <Text style={[styles.statusText, { color: live ? colors.leaf : colors.mut }]}>
              {live ? 'LIVE NOW' : 'ENDED'}
            </Text>
          </View>
        </View>

        {/* Intro copy */}
        <Text style={styles.introCopy}>
          They scan it once with their phone camera — no app needed. We'll take care of the rest.
        </Text>

        {/* QR Card */}
        <View style={[styles.qrCard, neoShadow]}>
          <View style={styles.qrInnerBox}>
            {guestUrl ? (
              <QRCode value={guestUrl} size={180} color={colors.ink} backgroundColor={colors.white} />
            ) : (
              <ActivityIndicator size="small" color={colors.ink} />
            )}
          </View>
          <Text style={styles.qrShareLabel}>OR SHARE THIS CODE</Text>
          <Text style={styles.qrInviteCode}>{trip.invite_code}</Text>
        </View>

        {/* Stats Row */}
        <View style={[styles.statsRow, neoShadow]}>
          <View style={styles.statCol}>
            <Users size={18} strokeWidth={2.8} color={colors.flame} />
            <Text style={styles.statNumber}>{trip.attendee_count ?? 0}</Text>
            <Text style={styles.statLabel}>GUESTS JOINED</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <ImageIcon size={18} strokeWidth={2.8} color={colors.sky} />
            <Text style={styles.statNumber}>{trip.media_count ?? 0}</Text>
            <Text style={styles.statLabel}>PHOTOS UPLOADED</Text>
          </View>
        </View>

        {/* Upload progress banner */}
        {upload && (
          <View style={[styles.uploadProgressBox, neoShadow]}>
            <View style={styles.progressHeaderRow}>
              <Text style={styles.progressText}>Uploading {upload.done} of {upload.total}…</Text>
              <Text style={styles.progressPercent}>
                {Math.round((upload.done / Math.max(upload.total, 1)) * 100)}%
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.round((upload.done / Math.max(upload.total, 1)) * 100)}%` }]} />
            </View>
          </View>
        )}

        {/* Actions section */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            onPress={() => { setNameDraft(displayName); setSettingsOpen(true); }}
            style={[styles.actionBtnWhite, neoShadow]}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnTextInk}>TRIP SETTINGS</Text>
          </TouchableOpacity>

          {live ? (
            <>
              <TouchableOpacity
                onPress={handlePushPhotos}
                disabled={uploading || !allowUploads}
                style={[styles.actionBtnBrand, neoShadow, (uploading || !allowUploads) && styles.btnDisabled]}
                activeOpacity={0.8}
              >
                <Text style={styles.actionBtnTextInk}>
                  {upload ? `UPLOADING ${upload.done}/${upload.total}…` : 'UPLOAD MY PHOTOS NOW'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setEndOpen(true)} style={[styles.actionBtnWhite, neoShadow]} activeOpacity={0.8}>
                <Text style={styles.actionBtnTextFlame}>END THIS TRIP</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={handleReliveTrip}
                disabled={reliveBusy}
                style={[styles.actionBtnBrand, neoShadow, reliveBusy && styles.btnDisabled]}
                activeOpacity={0.8}
              >
                <View style={styles.reliveInnerRow}>
                  <RotateCcw size={17} strokeWidth={2.8} color={colors.ink} />
                  <Text style={styles.actionBtnTextInk}>{reliveBusy ? 'RELIVING…' : 'RELIVE THIS TRIP'}</Text>
                </View>
              </TouchableOpacity>
              <Text style={styles.endedDisclaimer}>This trip has ended. Guests keep their photos forever.</Text>
            </>
          )}
        </View>
      </ScrollView>

      {/* Settings Sheet */}
      <NeoSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Trip settings" subtitle={`Invite code · ${trip.invite_code}`}>
        <NeoField label="Trip name">
          <NeoInput value={nameDraft} onChangeText={setNameDraft} placeholder="Trip name" />
        </NeoField>

        <Text style={styles.sheetSectionLabel}>GUEST DOWNLOADS</Text>
        <View style={styles.permissionsList}>
          {PERMISSION_OPTIONS.map((opt) => {
            const isSelected = downloadPermission === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => handleSavePermission(opt.value)}
                disabled={permissionSaving}
                style={[styles.permissionCard, isSelected ? styles.permissionCardSelected : styles.permissionCardUnselected, isSelected && neoShadow]}
                activeOpacity={0.8}
              >
                <View style={styles.permissionCardCopy}>
                  <Text style={styles.permissionTitle}>{opt.title}</Text>
                  <Text style={[styles.permissionSub, { color: isSelected ? 'rgba(16,16,16,0.75)' : colors.mut }]}>
                    {opt.description}
                  </Text>
                </View>
                {isSelected ? <BadgeCheck size={21} strokeWidth={2.8} color={colors.ink} /> : null}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Allow guest uploads</Text>
          <NeoToggle on={allowUploads} onChange={setAllowUploads} label="Allow guest uploads" />
        </View>

        <View style={styles.sheetActions}>
          <NeoButton title="Save changes" onPress={handleSaveName} size="lg" />
          <TouchableOpacity
            onPress={() => { setSettingsOpen(false); setDeleteDraft(''); setDeleteOpen(true); }}
            style={[styles.deleteBtnOutline, neoShadow]}
            activeOpacity={0.8}
          >
            <Flag size={16} strokeWidth={3} color={colors.flame} />
            <Text style={styles.deleteBtnOutlineText}>Delete trip</Text>
          </TouchableOpacity>
        </View>
      </NeoSheet>

      {/* End Trip Sheet */}
      <NeoSheet open={endOpen} onClose={() => setEndOpen(false)} title="End this trip?" subtitle="Guests keep every photo already uploaded.">
        <View style={styles.infoBanner}>
          <Upload size={19} strokeWidth={2.6} color={colors.flame} />
          <Text style={styles.infoBannerText}>
            {(trip.media_count ?? 0) === 0
              ? 'No photos have been uploaded to this trip yet.'
              : `${trip.media_count} photo${(trip.media_count ?? 0) > 1 ? 's' : ''} will stay available to all guests.`}
          </Text>
        </View>
        <View style={styles.modalBtns}>
          <NeoButton title={endBusy ? 'Ending…' : 'End this trip'} onPress={handleEndTrip} variant="danger" size="lg" loading={endBusy} />
          <View style={{ height: 11 }} />
          <NeoButton title="Keep it live" onPress={() => setEndOpen(false)} variant="secondary" size="md" />
        </View>
      </NeoSheet>

      {/* Delete Trip Sheet */}
      <NeoSheet open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete this trip?" subtitle="This permanently removes the trip and its photos.">
        <View style={styles.infoBanner}>
          <Flag size={19} strokeWidth={2.6} color={colors.flame} />
          <Text style={styles.infoBannerText}>
            Type <Text style={{ color: colors.flame, fontFamily: 'Nunito_900Black' }}>DELETE</Text> to confirm. This cannot be undone.
          </Text>
        </View>
        <NeoField label="Confirmation">
          <NeoInput value={deleteDraft} onChangeText={setDeleteDraft} placeholder="DELETE" autoCapitalize="characters" />
        </NeoField>
        <View style={styles.modalBtns}>
          <NeoButton
            title={deleteBusy ? 'Deleting…' : 'Delete forever'}
            onPress={handleDeleteTrip}
            variant="danger"
            size="lg"
            loading={deleteBusy}
            disabled={deleteDraft.trim().toUpperCase() !== 'DELETE'}
          />
          <View style={{ height: 11 }} />
          <NeoButton title="Keep this trip" onPress={() => setDeleteOpen(false)} variant="secondary" size="md" />
        </View>
      </NeoSheet>
    </View>
  );
}
