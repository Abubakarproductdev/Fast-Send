import { API_BASE_URL } from '../../config/api';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/spacing';
import { ScreenShell } from '../../components/ScreenShell';
import { useTheme } from '../../context/ThemeContext';

const formatDate = (dateStr: string) => { try { return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return 'Unknown date'; } };

export default function TripsScreen() {
  const { organizerId } = useAuth(); const [trips, setTrips] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false); const [error, setError] = useState<string | null>(null); const fadeAnim = useRef(new Animated.Value(0)).current;
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  useEffect(() => { Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start(); }, []);
  const loadTrips = async () => {
    if (!organizerId) { setError('Session expired. Please sign in.'); setLoading(false); setRefreshing(false); return; }
    setError(null); try { const response = await fetchWithTimeout(`${API_BASE_URL}/api/v1/trips/organizer/${organizerId}`, {}, 10000); if (response.status === 404) { setTrips([]); return; } if (!response.ok) throw new Error('Failed to fetch archive'); const data = await response.json(); setTrips(Array.isArray(data) ? data : []); } catch (e: any) { setError(e.message || 'Connection error'); } finally { setLoading(false); setRefreshing(false); }
  };
  useEffect(() => { loadTrips(); }, [organizerId]);
  return (
    <ScreenShell>
      <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>
        <View style={styles.header}><View><Text style={styles.eyebrow}>YOUR JOURNEYS</Text><Text style={styles.title}>Archive</Text></View><View style={styles.count}><Text style={styles.countText}>{trips.length}</Text><Text style={styles.countLabel}>TRIPS</Text></View></View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadTrips(); }} tintColor={colors.primary} />}>
          {error ? <View style={styles.state}><Ionicons name="cloud-offline-outline" size={32} color={colors.primaryDark} /><Text style={styles.stateTitle}>Archive unavailable</Text><Text style={styles.stateSub}>{error}</Text><TouchableOpacity onPress={loadTrips} style={styles.retry}><Text style={styles.retryText}>Try again</Text></TouchableOpacity></View> : loading ? <View style={styles.state}><Ionicons name="hourglass-outline" size={26} color={colors.primaryDark} /><Text style={styles.stateSub}>Opening your archive…</Text></View> : trips.length === 0 ? <View style={styles.state}><View style={styles.emptyIcon}><Ionicons name="albums-outline" size={30} color={colors.sageDark} /></View><Text style={styles.stateTitle}>No history yet</Text><Text style={styles.stateSub}>Your completed journeys will be collected here.</Text></View> : trips.map((trip) => <TouchableOpacity key={trip.id} style={styles.card} activeOpacity={0.86}><View style={styles.cardHeader}><View style={[styles.statusPill, { backgroundColor: trip.is_active ? colors.successLight : colors.bgElevated }]}><View style={[styles.statusDot, { backgroundColor: trip.is_active ? colors.success : colors.textMuted }]} /><Text style={[styles.statusText, { color: trip.is_active ? colors.success : colors.textMuted }]}>{trip.is_active ? 'ACTIVE' : 'ARCHIVED'}</Text></View><Text style={styles.dateText}>{formatDate(trip.created_at)}</Text></View><View style={styles.cardTitleRow}><View><Text style={styles.cardEyebrow}>INVITE CODE</Text><Text style={styles.tripCode}>{trip.invite_code}</Text></View><Ionicons name="arrow-up-right-box" size={20} color={colors.primaryDark} /></View><View style={styles.cardFooter}><View style={styles.metaItem}><Ionicons name="people-outline" size={16} color={colors.primaryDark} /><Text style={styles.metaVal}>{trip.attendee_count ?? 0}</Text><Text style={styles.metaLabel}>Guests</Text></View><View style={styles.metaDivider} /><View style={styles.metaItem}><Ionicons name="images-outline" size={16} color={colors.primaryDark} /><Text style={styles.metaVal}>{trip.media_count ?? 0}</Text><Text style={styles.metaLabel}>Photos</Text></View></View></TouchableOpacity>)}
        </ScrollView>
      </Animated.View>
    </ScreenShell>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  inner: { flex: 1, paddingTop: 14 }, header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 26 }, eyebrow: { color: colors.primaryDark, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8 }, title: { color: colors.textPrimary, fontSize: 34, fontWeight: '800', letterSpacing: -0.9 }, count: { alignItems: 'flex-end' }, countText: { color: colors.primaryDark, fontSize: 26, fontWeight: '800' }, countLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '900', letterSpacing: 1.4 }, list: { paddingBottom: 116, gap: 14 }, card: { backgroundColor: colors.paper, borderRadius: radius.xl, padding: 18, borderWidth: 1, borderColor: colors.border }, cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }, statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, paddingVertical: 6, borderRadius: radius.full }, statusDot: { width: 6, height: 6, borderRadius: 3 }, statusText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 }, dateText: { color: colors.textMuted, fontSize: 11, fontWeight: '600' }, cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }, cardEyebrow: { color: colors.textMuted, fontSize: 9, fontWeight: '900', letterSpacing: 1.3, marginBottom: 5 }, tripCode: { color: colors.textPrimary, fontSize: 28, fontWeight: '900', letterSpacing: 3 }, cardFooter: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderRadius: radius.md, paddingVertical: 12 }, metaItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }, metaVal: { color: colors.textPrimary, fontSize: 14, fontWeight: '800' }, metaLabel: { color: colors.textMuted, fontSize: 12 }, metaDivider: { width: 1, height: 20, backgroundColor: colors.border }, state: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 35, gap: 10 }, emptyIcon: { width: 66, height: 66, borderRadius: 24, backgroundColor: colors.sage, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }, stateTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '800' }, stateSub: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, textAlign: 'center' }, retry: { marginTop: 8, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.borderStrong, paddingHorizontal: 18, paddingVertical: 10, borderRadius: radius.full }, retryText: { color: colors.primaryDark, fontSize: 13, fontWeight: '800' },
});
