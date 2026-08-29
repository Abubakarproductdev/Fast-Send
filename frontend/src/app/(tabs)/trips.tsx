import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Animated, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { api, TripDetail } from '../../services/api';
import type { ThemeColors } from '../../theme/colors';
import { radius } from '../../theme/spacing';
import { ScreenShell } from '../../components/ScreenShell';
import { useTheme } from '../../context/ThemeContext';

const formatDate = (dateStr: string) => { try { return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return 'Unknown date'; } };

export default function TripsScreen() {
  const router = useRouter();
  const { organizerId } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = makeStyles(colors, isDark);
  const [trips, setTrips] = useState<TripDetail[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start(); }, []);

  const loadTrips = async (reset = false) => {
    if (!organizerId) { setError('Session expired. Please sign in.'); setLoading(false); setRefreshing(false); return; }
    if (reset) { setError(null); setHasMore(true); if (!refreshing) setLoading(true); }
    else { setLoadingMore(true); }
    
    try {
      const skip = reset ? 0 : trips.length;
      const newTrips = await api.getOrganizerTrips(organizerId, 6, skip, search);
      
      if (reset) setTrips(newTrips);
      else setTrips(prev => [...prev, ...newTrips]);
      
      setHasMore(newTrips.length === 6);
    }
    catch (e: any) { setError(e.message || 'Connection error'); }
    finally { setLoading(false); setRefreshing(false); setLoadingMore(false); }
  };

  useEffect(() => { loadTrips(true); }, [organizerId]);

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => loadTrips(true), 400);
    return () => clearTimeout(timeout);
  }, [search]);

  return <ScreenShell><Animated.View style={[styles.inner, { opacity: fadeAnim }]}>
    <View style={styles.header}><View><Text style={styles.eyebrow}>YOUR TRIPS</Text><Text style={styles.title}>Past Trips</Text></View></View>
    <View style={styles.searchBox}><Ionicons name="search-outline" size={18} color={colors.textMuted} /><TextInput value={search} onChangeText={setSearch} placeholder="Search by name or invite code…" placeholderTextColor={colors.textMuted} style={styles.searchInput} returnKeyType="search" /><TouchableOpacity onPress={() => setSearch('')} disabled={!search} style={styles.clearSearch}>{!!search && <Ionicons name="close-circle" size={18} color={colors.textMuted} />}</TouchableOpacity></View>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadTrips(true); }} tintColor={colors.primary} />}>
      {error ? <View style={styles.state}><Ionicons name="cloud-offline-outline" size={32} color={colors.primaryDark} /><Text style={styles.stateTitle}>Can't load trips</Text><Text style={styles.stateSub}>{error}</Text><TouchableOpacity onPress={() => loadTrips(true)} style={styles.retry}><Text style={styles.retryText}>Try again</Text></TouchableOpacity></View>
      : loading ? <View style={styles.state}><Ionicons name="hourglass-outline" size={26} color={colors.primaryDark} /><Text style={styles.stateSub}>Loading your trips…</Text></View>
      : trips.length === 0 ? <View style={styles.state}><View style={styles.emptyIcon}><Ionicons name={search ? 'search-outline' : 'camera-outline'} size={30} color={colors.sageDark} /></View><Text style={styles.stateTitle}>{search ? 'No trips found' : 'No trips yet'}</Text><Text style={styles.stateSub}>{search ? 'Try a different name or the 8-letter invite code.' : 'Your past trips will appear here. Start one from the Home tab!'}</Text></View>
      : <>
        {trips.map((trip) => <TouchableOpacity key={trip.id} style={styles.card} activeOpacity={0.86} onPress={() => router.push(`/trip-details?tripId=${encodeURIComponent(trip.id)}`)}>
          <View style={styles.cardHeader}><View style={[styles.statusPill, { backgroundColor: trip.is_active ? colors.successLight : colors.bgElevated }]}><View style={[styles.statusDot, { backgroundColor: trip.is_active ? colors.success : colors.textMuted }]} /><Text style={[styles.statusText, { color: trip.is_active ? colors.success : colors.textMuted }]}>{trip.is_active ? 'LIVE NOW' : 'ENDED'}</Text></View><Text style={styles.dateText}>{formatDate(trip.created_at)}</Text></View>
          <View style={styles.cardTitleRow}><View style={styles.titleCopy}><Text style={styles.tripName}>{trip.name || 'Untitled trip'}</Text><Text style={styles.cardEyebrow}>INVITE CODE · {trip.invite_code}</Text></View><Ionicons name="arrow-up-right-box" size={20} color={colors.primaryDark} /></View>
          <View style={styles.cardFooter}><View style={styles.metaItem}><Ionicons name="people-outline" size={16} color={colors.primaryDark} /><Text style={styles.metaVal}>{trip.attendee_count ?? 0}</Text><Text style={styles.metaLabel}>Guests</Text></View><View style={styles.metaDivider} /><View style={styles.metaItem}><Ionicons name="images-outline" size={16} color={colors.primaryDark} /><Text style={styles.metaVal}>{trip.media_count ?? 0}</Text><Text style={styles.metaLabel}>Photos</Text></View></View>
        </TouchableOpacity>)}
        {hasMore && (
          <TouchableOpacity onPress={() => loadTrips(false)} disabled={loadingMore} style={styles.loadMoreBtn}>
            <Text style={styles.loadMoreText}>{loadingMore ? 'Loading…' : 'Show more trips'}</Text>
          </TouchableOpacity>
        )}
      </>}
    </ScrollView>
  </Animated.View></ScreenShell>;
}

const makeStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  inner: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }, eyebrow: { color: colors.primaryDark, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8 }, title: { color: colors.textPrimary, fontSize: 34, fontWeight: '800', letterSpacing: -0.9 }, searchBox: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: isDark ? colors.bg : colors.paper, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderStrong, minHeight: 52, paddingHorizontal: 14, marginBottom: 16 }, searchInput: { flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: '600' }, clearSearch: { minWidth: 20, alignItems: 'flex-end' }, list: { paddingBottom: 116, gap: 14 }, card: { backgroundColor: colors.paper, borderRadius: radius.xl, padding: 18, borderWidth: 1, borderColor: colors.border }, cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }, statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, paddingVertical: 6, borderRadius: radius.full }, statusDot: { width: 6, height: 6, borderRadius: 3 }, statusText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 }, dateText: { color: colors.textMuted, fontSize: 11, fontWeight: '600' }, cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }, titleCopy: { flex: 1, paddingRight: 10 }, tripName: { color: colors.textPrimary, fontSize: 20, fontWeight: '800', marginBottom: 7 }, cardEyebrow: { color: colors.textMuted, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 }, cardFooter: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderRadius: radius.md, paddingVertical: 12 }, metaItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }, metaVal: { color: colors.textPrimary, fontSize: 14, fontWeight: '800' }, metaLabel: { color: colors.textMuted, fontSize: 12 }, metaDivider: { width: 1, height: 20, backgroundColor: colors.border }, state: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 35, gap: 10 }, emptyIcon: { width: 66, height: 66, borderRadius: 24, backgroundColor: colors.sage, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }, stateTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '800' }, stateSub: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, textAlign: 'center' }, retry: { marginTop: 8, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.borderStrong, paddingHorizontal: 18, paddingVertical: 10, borderRadius: radius.full }, retryText: { color: colors.primaryDark, fontSize: 13, fontWeight: '800' }, loadMoreBtn: { paddingVertical: 18, alignItems: 'center' }, loadMoreText: { color: colors.textSecondary, fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },

});
