import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { scheduleUploadReminders } from '../services/NotificationService';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenShell } from '../components/ScreenShell';
import { useTheme } from '../context/ThemeContext';
import { getOrganizerSettings } from '../services/OrganizerSettingsService';
import { api } from '../services/api';

export default function CreateTripScreen() {
  const router = useRouter();
  const { organizerId, setActiveTripId, setTripStartTime } = useAuth();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [tripName, setTripName] = useState(''); const [loading, setLoading] = useState(false); const [tripNameError, setTripNameError] = useState<string | undefined>();
  const fadeAnim = useRef(new Animated.Value(0)).current; const slideAnim = useRef(new Animated.Value(20)).current;
  useEffect(() => { Animated.parallel([Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }), Animated.spring(slideAnim, { toValue: 0, bounciness: 4, speed: 10, useNativeDriver: true })]).start(); }, []);

  const handleCreate = async () => {
    if (!tripName.trim()) { setTripNameError('Please give your trip a name'); return; }
    if (!organizerId) { Alert.alert('Session Error', 'Please sign in again.'); router.replace('/login'); return; }
    setLoading(true);
    try {
      const trip = await api.createTrip(organizerId, tripName.trim()); const deviceStartTime = new Date().toISOString();
      await setActiveTripId(trip.id); await setTripStartTime(deviceStartTime);
      getOrganizerSettings(organizerId).then((settings) => scheduleUploadReminders(settings.sync_interval_hours)).catch(() => scheduleUploadReminders());
      router.replace('/active-trip');
    } catch (e: any) { Alert.alert('Error', e.message); } finally { setLoading(false); }
  };

  return (
    <ScreenShell>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={20} color={colors.textPrimary} /></TouchableOpacity>
          <View style={styles.header}><Text style={styles.eyebrow}>NEW COLLECTION</Text><Text style={styles.title}>Name the moment.</Text><Text style={styles.subtitle}>A small detail now makes the whole gallery easier to remember later.</Text></View>
          <View style={styles.formCard}><InputField label="Trip name" placeholder="Summer gala 2026" value={tripName} onChangeText={(t) => { setTripName(t); setTripNameError(undefined); }} autoFocus error={tripNameError} /><View style={styles.note}><Ionicons name="lock-closed-outline" size={17} color={colors.sageDark} /><Text style={styles.noteText}>Your guests will see this as the name of their private collection.</Text></View></View>
          <Text style={styles.sectionTitle}>WHAT HAPPENS NEXT</Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}><View style={styles.featureIcon}><Ionicons name="time-outline" size={20} color={colors.primaryDark} /></View><View style={styles.featureCopy}><Text style={styles.featureTitle}>Smart capture</Text><Text style={styles.featureDesc}>Only photos taken after this moment are added.</Text></View></View>
            <View style={styles.featureItem}><View style={styles.featureIcon}><Ionicons name="sparkles-outline" size={20} color={colors.primaryDark} /></View><View style={styles.featureCopy}><Text style={styles.featureTitle}>Personal delivery</Text><Text style={styles.featureDesc}>AI recognizes faces and routes each photo to the right guest.</Text></View></View>
            <View style={styles.featureItem}><View style={styles.featureIcon}><Ionicons name="qr-code-outline" size={20} color={colors.primaryDark} /></View><View style={styles.featureCopy}><Text style={styles.featureTitle}>One simple invite</Text><Text style={styles.featureDesc}>Share a single QR code and let the room join in.</Text></View></View>
          </View>
          <PrimaryButton title={loading ? 'Creating...' : 'Launch collection'} onPress={handleCreate} disabled={!tripName.trim() || loading} loading={loading} style={styles.submitBtn} />
        </Animated.View>
      </ScrollView>
    </ScreenShell>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  scroll: { paddingTop: 15, paddingBottom: 40 },
  backBtn: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  header: { marginBottom: 27 }, eyebrow: { color: colors.primaryDark, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 10 }, title: { color: colors.textPrimary, fontSize: 35, lineHeight: 39, fontWeight: '800', letterSpacing: -1, marginBottom: 11 }, subtitle: { color: colors.textSecondary, fontSize: 15, lineHeight: 22 },
  formCard: { backgroundColor: colors.paper, borderRadius: radius.xl, padding: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 30 }, note: { flexDirection: 'row', gap: 9, backgroundColor: colors.sage, borderRadius: radius.md, padding: 13, alignItems: 'center' }, noteText: { flex: 1, color: colors.sageDark, fontSize: 12, lineHeight: 17, fontWeight: '600' },
  sectionTitle: { color: colors.textPrimary, fontSize: 11, fontWeight: '900', letterSpacing: 1.4, marginBottom: 13 },
  featureList: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: 17, marginBottom: 24 }, featureItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.divider }, featureIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center', marginRight: 13 }, featureCopy: { flex: 1 }, featureTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '800', marginBottom: 3 }, featureDesc: { color: colors.textSecondary, fontSize: 12, lineHeight: 17 }, submitBtn: { marginTop: 3 },
});
