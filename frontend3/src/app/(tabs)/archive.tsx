import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Users, Image as ImageIcon, Pencil, Plus, CloudOff } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTripModal } from '../../context/TripModalContext';
import { api, TripDetail } from '../../services/api';
import { storage } from '../../utils/storage';
import { getErrorMessage } from '../../utils/errors';
import { StatusBar } from '../../components/StatusBar';
import { NeoSheet } from '../../components/ui/NeoSheet';
import { NeoField } from '../../components/ui/NeoField';
import { NeoInput } from '../../components/ui/NeoInput';
import { NeoButton } from '../../components/ui/NeoButton';
import { useTheme } from '../../theme/ThemeContext';

const PAGE_SIZE = 6;
const SEARCH_DEBOUNCE_MS = 350;

const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function ArchiveScreen() {
  const router = useRouter();
  const { organizerId } = useAuth();
  const { openCreateTrip, showToast } = useTripModal();
  const { colors, neoShadow } = useTheme();

  const [trips, setTrips] = useState<TripDetail[]>([]);
  const [renames, setRenames] = useState<Record<string, string>>({});
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const [editingTrip, setEditingTrip] = useState<TripDetail | null>(null);
  const [draftName, setDraftName] = useState('');

  const loadRenames = async () => {
    const map = await storage.getTripRenames();
    setRenames(map);
  };

  const loadTrips = useCallback(
    async (searchStr: string, skip: number, append: boolean) => {
      if (!organizerId) return;
      if (append) setLoadingMore(true);
      else {
        setLoading(true);
        setError(null);
      }

      try {
        const page = await api.getOrganizerTrips(organizerId, PAGE_SIZE, skip, searchStr);
        setTrips((prev) => (append ? [...prev, ...page] : page));
        setHasMore(page.length === PAGE_SIZE);
      } catch (err) {
        if (!append) setError(getErrorMessage(err));
        else showToast(getErrorMessage(err));
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [organizerId],
  );

  useEffect(() => {
    loadRenames();
  }, []);

  useEffect(() => {
    if (!organizerId) {
      setTrips([]);
      return;
    }
    const timer = setTimeout(() => {
      loadTrips(query.trim(), 0, false);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [organizerId, query, loadTrips]);

  const handleSaveRename = async () => {
    if (editingTrip && draftName.trim()) {
      await storage.setTripRename(editingTrip.id, draftName.trim());
      setRenames((prev) => ({ ...prev, [editingTrip.id]: draftName.trim() }));
      showToast('Trip renamed');
    }
    setEditingTrip(null);
  };

  const getTripDisplayName = (t: TripDetail) => {
    return renames[t.id] || t.name || 'Untitled Trip';
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.cream,
    },
    scroll: {
      paddingBottom: 40,
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 8,
      marginBottom: 12,
    },
    eyebrow: {
      fontSize: 12,
      fontWeight: '900',
      fontFamily: 'Nunito_900Black',
      textTransform: 'uppercase',
      letterSpacing: 2,
      color: colors.flame,
      marginBottom: 4,
    },
    title: {
      fontSize: 36,
      fontWeight: '900',
      fontFamily: 'Nunito_900Black',
      color: colors.ink,
    },
    searchSection: {
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    searchBox: {
      position: 'relative',
      flexDirection: 'row',
      alignItems: 'center',
    },
    searchIconWrap: {
      position: 'absolute',
      left: 16,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
      zIndex: 1,
    },
    searchInput: {
      paddingLeft: 50,
      backgroundColor: colors.creamDeep,
      borderRadius: 999,
    },
    listSection: {
      paddingHorizontal: 16,
      gap: 14,
    },
    loadingWrap: {
      paddingVertical: 40,
      alignItems: 'center',
      gap: 12,
    },
    loadingText: {
      fontSize: 15,
      fontWeight: '700',
      fontFamily: 'Nunito_700Bold',
      color: colors.mut,
    },
    errorCard: {
      borderRadius: 22,
      borderWidth: 2,
      borderColor: colors.ink,
      backgroundColor: colors.flameSoft,
      padding: 24,
      alignItems: 'center',
    },
    errorTitle: {
      fontSize: 17,
      fontWeight: '900',
      fontFamily: 'Nunito_900Black',
      color: colors.ink,
      marginTop: 8,
    },
    errorSub: {
      fontSize: 13,
      fontWeight: '700',
      fontFamily: 'Nunito_700Bold',
      color: colors.ink,
      opacity: 0.6,
      marginTop: 4,
      textAlign: 'center',
    },
    retryBtn: {
      marginTop: 14,
    },
    emptyCard: {
      borderRadius: 22,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: 'rgba(16, 16, 16, 0.25)',
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
      padding: 28,
      alignItems: 'center',
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: '900',
      fontFamily: 'Nunito_900Black',
      color: colors.ink,
    },
    emptySub: {
      fontSize: 13,
      fontWeight: '700',
      fontFamily: 'Nunito_700Bold',
      color: colors.mut,
      marginTop: 4,
      textAlign: 'center',
    },
    createBtnWrap: {
      marginTop: 16,
    },
    tripCard: {
      borderRadius: 22,
      borderWidth: 2,
      borderColor: colors.ink,
      backgroundColor: colors.white,
      padding: 16,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusText: {
      fontSize: 10,
      fontWeight: '900',
      fontFamily: 'Nunito_900Black',
      textTransform: 'uppercase',
      letterSpacing: 1.4,
    },
    dateText: {
      fontSize: 12,
      fontWeight: '700',
      fontFamily: 'Nunito_700Bold',
      color: colors.mut,
    },
    nameRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 10,
      gap: 8,
    },
    tripName: {
      flex: 1,
      fontSize: 24,
      fontWeight: '900',
      fontFamily: 'Nunito_900Black',
      color: colors.ink,
    },
    pencilBtn: {
      width: 32,
      height: 32,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.ink,
      backgroundColor: colors.flame,
      justifyContent: 'center',
      alignItems: 'center',
    },
    inviteCodeText: {
      fontSize: 11,
      fontWeight: '900',
      fontFamily: 'Nunito_900Black',
      textTransform: 'uppercase',
      letterSpacing: 1.6,
      color: colors.mut,
      marginTop: 4,
    },
    statsGrid: {
      flexDirection: 'row',
      borderRadius: 14,
      borderWidth: 2,
      borderColor: colors.ink,
      backgroundColor: colors.white,
      marginTop: 12,
      paddingVertical: 10,
    },
    statCell: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
    },
    statDivider: {
      width: 2,
      backgroundColor: 'rgba(16, 16, 16, 0.15)',
    },
    statNumber: {
      fontSize: 15,
      fontWeight: '900',
      fontFamily: 'Nunito_900Black',
      color: colors.ink,
    },
    statLabel: {
      fontSize: 12,
      fontWeight: '700',
      fontFamily: 'Nunito_700Bold',
      color: colors.mut,
    },
    showMoreWrap: {
      marginTop: 4,
    },
    renameBtnWrap: {
      marginTop: 12,
      marginBottom: 8,
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>YOUR TRIPS</Text>
          <Text style={styles.title}>Past Trips</Text>
        </View>

        {/* Search */}
        <View style={styles.searchSection}>
          <View style={styles.searchBox}>
            <View style={styles.searchIconWrap}>
              <Search size={18} strokeWidth={2.8} color={colors.mut} />
            </View>
            <NeoInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by name or invite code..."
              style={styles.searchInput}
            />
          </View>
        </View>

        {/* Trip List */}
        <View style={styles.listSection}>
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={colors.flame} />
              <Text style={styles.loadingText}>Loading trips…</Text>
            </View>
          ) : null}

          {!loading && error ? (
            <View style={[styles.errorCard, neoShadow]}>
              <CloudOff size={28} strokeWidth={2.6} color={colors.flame} />
              <Text style={styles.errorTitle}>Couldn't load trips</Text>
              <Text style={styles.errorSub}>{error}</Text>
              <View style={styles.retryBtn}>
                <NeoButton
                  title="Try again"
                  onPress={() => loadTrips(query.trim(), 0, false)}
                  size="sm"
                />
              </View>
            </View>
          ) : null}

          {!loading && !error && trips.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No trips found</Text>
              <Text style={styles.emptySub}>
                {query ? `Nothing matches "${query}".` : 'Start your first trip to see it here.'}
              </Text>
              {!query ? (
                <View style={styles.createBtnWrap}>
                  <NeoButton
                    title="Create a new trip"
                    onPress={openCreateTrip}
                    size="sm"
                    icon={<Plus size={17} strokeWidth={3.2} color={colors.ink} />}
                  />
                </View>
              ) : null}
            </View>
          ) : null}

          {!loading && !error
            ? trips.map((trip) => {
                const live = trip.is_active;
                return (
                  <TouchableOpacity
                    key={trip.id}
                    onPress={() => router.push(`/trip-details?tripId=${trip.id}`)}
                    style={[styles.tripCard, neoShadow]}
                    activeOpacity={0.8}
                  >
                    {/* Status & Date */}
                    <View style={styles.cardHeader}>
                      <View
                        style={[
                          styles.statusPill,
                          { backgroundColor: live ? colors.leafSoft : colors.creamDeep },
                        ]}
                      >
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: live ? colors.leaf : colors.mut },
                          ]}
                        />
                        <Text
                          style={[
                            styles.statusText,
                            { color: live ? colors.leaf : colors.mut },
                          ]}
                        >
                          {live ? 'LIVE NOW' : 'ENDED'}
                        </Text>
                      </View>
                      <Text style={styles.dateText}>{formatDate(trip.created_at)}</Text>
                    </View>

                    {/* Trip Name & Rename */}
                    <View style={styles.nameRow}>
                      <Text style={styles.tripName} numberOfLines={1}>
                        {getTripDisplayName(trip)}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setEditingTrip(trip);
                          setDraftName(getTripDisplayName(trip));
                        }}
                        style={[styles.pencilBtn, neoShadow]}
                        activeOpacity={0.8}
                      >
                        <Pencil size={15} strokeWidth={2.8} color={colors.cream} />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.inviteCodeText}>
                      INVITE CODE · {trip.invite_code}
                    </Text>

                    {/* Stats */}
                    <View style={styles.statsGrid}>
                      <View style={styles.statCell}>
                        <Users size={15} strokeWidth={2.6} color={colors.flame} />
                        <Text style={styles.statNumber}>{trip.attendee_count ?? 0}</Text>
                        <Text style={styles.statLabel}>Guests</Text>
                      </View>
                      <View style={styles.statDivider} />
                      <View style={styles.statCell}>
                        <ImageIcon size={15} strokeWidth={2.6} color={colors.sky} />
                        <Text style={styles.statNumber}>{trip.media_count ?? 0}</Text>
                        <Text style={styles.statLabel}>Photos</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            : null}

          {!loading && !error && hasMore ? (
            <View style={styles.showMoreWrap}>
              <NeoButton
                title={loadingMore ? 'Loading…' : 'Show more trips'}
                onPress={() => loadTrips(query.trim(), trips.length, true)}
                variant="secondary"
                disabled={loadingMore}
              />
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Rename Sheet */}
      <NeoSheet
        open={!!editingTrip}
        onClose={() => setEditingTrip(null)}
        title="Rename trip"
        subtitle={editingTrip ? `Invite code · ${editingTrip.invite_code}` : undefined}
      >
        <NeoField label="Trip name">
          <NeoInput
            value={draftName}
            onChangeText={setDraftName}
            placeholder="Enter new trip name"
            autoFocus
          />
        </NeoField>
        <View style={styles.renameBtnWrap}>
          <NeoButton title="Save name" onPress={handleSaveRename} size="lg" />
        </View>
      </NeoSheet>
    </View>
  );
}
