import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { GUEST_WEBAPP_URL } from '../config/api';
import { api, TripDetail } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { radius } from '../theme/spacing';
import type { ThemeColors } from '../theme/colors';
import { ScreenShell } from '../components/ScreenShell';
import { PrimaryButton } from '../components/PrimaryButton';
import { getOrganizerSettings } from '../services/OrganizerSettingsService';
import { scheduleUploadReminders, cancelAllUploadReminders } from '../services/NotificationService';

const formatDate = (dateStr: string) => { try { return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); } catch { return 'Unknown date'; } };

export default function TripDetailsScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { organizerId, activeTripId, setActiveTripId, setTripStartTime } = useAuth();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  useEffect(() => {
    if (!tripId) return;
    api.getTrip(tripId).then(setTrip).catch((error: any) => Alert.alert('Unable to open trip', error.message || 'Please try again.')).finally(() => setLoading(false));
  }, [tripId]);

  const qrValue = useMemo(() => trip ? new URL(`?trip=${encodeURIComponent(trip.invite_code)}`, GUEST_WEBAPP_URL).toString() : 'loading', [trip]);

  const handleRelive = () => {
    if (!trip || !organizerId) return;
    Alert.alert('Relive this trip?', `This keeps ${trip.attendee_count} guests and ${trip.media_count} existing photos, then reopens the same QR invite for a new live session.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Relive trip', onPress: async () => {
        setActionLoading(true);
        try {
          const reopened = await api.reliveTrip(trip.id, organizerId);
          const startedAt = new Date().toISOString();
          await setActiveTripId(reopened.id); await setTripStartTime(startedAt);
          getOrganizerSettings(organizerId).then((settings) => scheduleUploadReminders(settings.sync_interval_hours)).catch(() => scheduleUploadReminders());
          router.replace('/active-trip');
        } catch (error: any) { Alert.alert('Could not relive trip', error.message || 'Please try again.'); }
        finally { setActionLoading(false); }
      } },
    ]);
  };

  const handleDelete = async () => {
    if (!trip || !organizerId || deleteConfirmation.trim().toUpperCase() !== 'DELETE') return;
    setActionLoading(true);
    try {
      await api.deleteTrip(trip.id, organizerId);
      if (activeTripId === trip.id) { await setActiveTripId(null); await setTripStartTime(null); await cancelAllUploadReminders(); }
      setDeleteModalVisible(false);
      router.replace('/(tabs)/trips');
    } catch (error: any) {
      Alert.alert('Deletion incomplete', error.message || 'The trip was kept so you can safely retry deletion.');
    } finally { setActionLoading(false); }
  };

  if (loading) return <ScreenShell><View style={styles.centerState}><ActivityIndicator color={colors.primary} /><Text style={styles.stateSub}>Loading trip details…</Text></View></ScreenShell>;
  if (!trip) return <ScreenShell><View style={styles.centerState}><Ionicons name="alert-circle-outline" size={34} color={colors.error} /><Text style={styles.stateTitle}>Trip unavailable</Text><Text style={styles.stateSub}>This trip may have been deleted or is temporarily unavailable.</Text><TouchableOpacity onPress={() => router.back()} style={styles.backLink}><Text style={styles.backLinkText}>Go back</Text></TouchableOpacity></View></ScreenShell>;

  return <ScreenShell><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
    <View style={styles.topBar}><TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Ionicons name="arrow-back" size={20} color={colors.textPrimary} /></TouchableOpacity><Text style={styles.topLabel}>TRIP DETAILS</Text><View style={styles.topSpacer} /></View>
    <Text style={styles.eyebrow}>{trip.is_active ? 'LIVE COLLECTION' : 'ARCHIVED COLLECTION'}</Text><Text style={styles.title}>{trip.name || 'Untitled trip'}</Text><Text style={styles.date}>Created {formatDate(trip.created_at)}</Text>
    <View style={styles.qrCard}><Text style={styles.qrTitle}>Scan to join this trip</Text><View style={styles.qrWrapper}><QRCode value={qrValue} size={190} color={colors.ink} backgroundColor="#FFFFFF" /></View><Text style={styles.inviteLabel}>INVITE CODE</Text><Text style={styles.inviteCode}>{trip.invite_code}</Text></View>
    <View style={styles.metrics}><View style={styles.metric}><Ionicons name="people-outline" size={20} color={colors.primaryDark} /><Text style={styles.metricValue}>{trip.attendee_count}</Text><Text style={styles.metricLabel}>GUESTS</Text></View><View style={styles.metricDivider} /><View style={styles.metric}><Ionicons name="images-outline" size={20} color={colors.primaryDark} /><Text style={styles.metricValue}>{trip.media_count}</Text><Text style={styles.metricLabel}>PHOTOS</Text></View></View>
    <Text style={styles.sectionTitle}>SESSION ACTIONS</Text>
    {trip.is_active ? <PrimaryButton title="Open live trip" onPress={() => router.replace('/active-trip')} loading={actionLoading} /> : <PrimaryButton title="Relive trip" onPress={handleRelive} loading={actionLoading} />}
    <TouchableOpacity style={styles.deleteButton} onPress={() => { setDeleteConfirmation(''); setDeleteModalVisible(true); }} disabled={actionLoading}><Ionicons name="trash-outline" size={18} color={colors.error} /><Text style={styles.deleteText}>Delete trip permanently</Text></TouchableOpacity>
    <Text style={styles.disclaimer}>Deleting removes this trip’s original photos and thumbnails from Azure, plus its related guest, media, insight, token, notification, and trip records from MongoDB.</Text>
  </ScrollView>

  <Modal visible={deleteModalVisible} transparent animationType="slide" onRequestClose={() => !actionLoading && setDeleteModalVisible(false)}>
    <View style={styles.modalBackdrop}><View style={styles.modalCard}><ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.modalIcon}><Ionicons name="warning-outline" size={23} color={colors.error} /></View><Text style={styles.modalTitle}>Delete “{trip.name || 'Untitled trip'}”?</Text><Text style={styles.modalIntro}>This is permanent. FastSend will perform the following scoped cleanup:</Text>
      <View style={styles.deleteList}><Text style={styles.deleteItem}>• Delete {trip.media_count} photo asset record{trip.media_count === 1 ? '' : 's'} and their Azure originals/thumbnails.</Text><Text style={styles.deleteItem}>• Delete {trip.attendee_count} guest record{trip.attendee_count === 1 ? '' : 's'} and guest access tokens.</Text><Text style={styles.deleteItem}>• Delete trip insights, notifications, and the trip record.</Text><Text style={styles.deleteItem}>• Refuse any blob outside this trip’s trip-specific storage prefix.</Text></View>
      <Text style={styles.confirmLabel}>Type DELETE to confirm</Text><TextInput value={deleteConfirmation} onChangeText={setDeleteConfirmation} autoCapitalize="characters" placeholder="DELETE" placeholderTextColor={colors.textMuted} style={styles.confirmInput} editable={!actionLoading} />
      <PrimaryButton title={actionLoading ? 'Deleting…' : 'Delete permanently'} onPress={handleDelete} type="danger" disabled={deleteConfirmation.trim().toUpperCase() !== 'DELETE' || actionLoading} loading={actionLoading} />
      <TouchableOpacity onPress={() => setDeleteModalVisible(false)} disabled={actionLoading} style={styles.cancelButton}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
    </ScrollView></View></View>
  </Modal>
  </ScreenShell>;
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  scroll: { paddingTop: 14, paddingBottom: 110 }, topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }, backButton: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, topLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 }, topSpacer: { width: 42 }, eyebrow: { color: colors.primaryDark, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 9 }, title: { color: colors.textPrimary, fontSize: 34, lineHeight: 39, fontWeight: '800', letterSpacing: -0.9 }, date: { color: colors.textSecondary, fontSize: 13, marginTop: 8, marginBottom: 23 }, qrCard: { backgroundColor: colors.sageDark, borderRadius: radius.xl, minHeight: 355, padding: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }, qrTitle: { color: colors.primaryLight, fontSize: 11, fontWeight: '900', letterSpacing: 1.1, marginBottom: 15 }, qrWrapper: { backgroundColor: '#FFFFFF', padding: 15, borderRadius: 22, marginBottom: 16 }, inviteLabel: { color: colors.primaryLight, fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginBottom: 5 }, inviteCode: { color: colors.paper, fontSize: 28, fontWeight: '900', letterSpacing: 4 }, metrics: { flexDirection: 'row', backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingVertical: 17, marginBottom: 28 }, metric: { flex: 1, alignItems: 'center', gap: 5 }, metricValue: { color: colors.textPrimary, fontSize: 24, fontWeight: '800' }, metricLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '900', letterSpacing: 1 }, metricDivider: { width: 1, backgroundColor: colors.divider }, sectionTitle: { color: colors.textPrimary, fontSize: 10, fontWeight: '900', letterSpacing: 1.4, marginBottom: 12 }, deleteButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: colors.errorLight, borderRadius: radius.md, paddingVertical: 16, marginTop: 2 }, deleteText: { color: colors.error, fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.6 }, disclaimer: { color: colors.textMuted, fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 15, paddingHorizontal: 10 }, centerState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 35, gap: 10 }, stateTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '800' }, stateSub: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, textAlign: 'center' }, backLink: { marginTop: 8, paddingHorizontal: 18, paddingVertical: 10, borderRadius: radius.full, borderWidth: 1, borderColor: colors.borderStrong }, backLinkText: { color: colors.primaryDark, fontWeight: '800' }, modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.58)', justifyContent: 'flex-end' }, modalCard: { maxHeight: '88%', backgroundColor: colors.paper, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: 22 }, modalIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: colors.errorLight, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }, modalTitle: { color: colors.textPrimary, fontSize: 24, fontWeight: '800', marginBottom: 9 }, modalIntro: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 15 }, deleteList: { backgroundColor: colors.errorLight, borderRadius: radius.md, padding: 14, gap: 8, marginBottom: 20 }, deleteItem: { color: colors.error, fontSize: 12, lineHeight: 18 }, confirmLabel: { color: colors.textPrimary, fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }, confirmInput: { color: colors.textPrimary, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.md, minHeight: 52, paddingHorizontal: 14, fontSize: 16, fontWeight: '800', letterSpacing: 2, marginBottom: 14 }, cancelButton: { alignItems: 'center', paddingVertical: 5 }, cancelText: { color: colors.textSecondary, fontWeight: '800' },
});
