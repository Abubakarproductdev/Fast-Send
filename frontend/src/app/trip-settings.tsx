import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenShell } from '../components/ScreenShell';
import { TripDownloadPermissions, DEFAULT_TRIP_SETTINGS } from '../components/TripDownloadPermissions';
import { api, TripSettings } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { radius } from '../theme/spacing';

export default function TripSettingsScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();
  const { organizerId } = useAuth();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [settings, setSettings] = useState<TripSettings>(DEFAULT_TRIP_SETTINGS);
  const [tripName, setTripName] = useState('Trip settings');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!tripId) {
      setLoading(false);
      return;
    }
    api.getTrip(tripId)
      .then((trip) => {
        setTripName(trip.name || 'Trip settings');
        if (trip.settings) setSettings({ ...DEFAULT_TRIP_SETTINGS, ...trip.settings });
      })
      .catch((error: any) => Alert.alert('Unable to load settings', error?.message || 'Please try again.'))
      .finally(() => setLoading(false));
  }, [tripId]);

  const save = async (patch: Partial<TripSettings>) => {
    if (!tripId || !organizerId || saving) return;
    const previous = settings;
    setSettings((current) => ({ ...current, ...patch }));
    setSaving(true);
    try {
      const updated = await api.updateTripSettings(tripId, organizerId, patch);
      setSettings({ ...DEFAULT_TRIP_SETTINGS, ...updated.settings });
    } catch (error: any) {
      setSettings(previous);
      Alert.alert('Could not save settings', error?.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return <ScreenShell>
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.topBar}><TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Ionicons name="arrow-back" size={20} color={colors.textPrimary} /></TouchableOpacity><View style={styles.topCopy}><Text style={styles.eyebrow}>LIVE SESSION</Text><Text style={styles.title}>Trip settings</Text></View><View style={styles.topSpacer} /></View>
      <View style={styles.tripBanner}><Ionicons name="radio-outline" size={19} color={colors.success} /><View style={styles.tripCopy}><Text style={styles.tripLabel}>CONFIGURING</Text><Text style={styles.tripName}>{tripName}</Text></View>{saving && <Text style={styles.saving}>Saving…</Text>}</View>
      {loading ? <View style={styles.loading}><Ionicons name="hourglass-outline" size={24} color={colors.primaryDark} /><Text style={styles.loadingText}>Loading settings…</Text></View> : <View style={styles.card}><TripDownloadPermissions settings={settings} onChange={save} disabled={saving || !organizerId} /></View>}
      <Text style={styles.footerNote}><Ionicons name="lock-closed-outline" size={14} color={colors.textMuted} /> These rules apply immediately to the guest app and its download endpoint.</Text>
    </ScrollView>
  </ScreenShell>;
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  scroll: { paddingTop: 8, paddingBottom: 46 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backButton: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.border },
  topCopy: { alignItems: 'center' },
  topSpacer: { width: 42 },
  eyebrow: { color: colors.primaryDark, fontSize: 9, fontWeight: '900', letterSpacing: 1.3, marginBottom: 4 },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
  tripBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.successLight, borderRadius: radius.lg, padding: 15, marginBottom: 20 },
  tripCopy: { flex: 1 },
  tripLabel: { color: colors.success, fontSize: 9, fontWeight: '900', letterSpacing: 1.2, marginBottom: 3 },
  tripName: { color: colors.textPrimary, fontSize: 14, fontWeight: '800' },
  saving: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  card: { backgroundColor: colors.paper, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: 18 },
  loading: { alignItems: 'center', gap: 10, paddingTop: 70 },
  loadingText: { color: colors.textSecondary, fontSize: 13 },
  footerNote: { color: colors.textMuted, fontSize: 11, lineHeight: 17, textAlign: 'center', paddingHorizontal: 17, marginTop: 21 },
});
