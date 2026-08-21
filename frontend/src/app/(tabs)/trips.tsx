import { API_BASE_URL } from '../../config/api';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Animated,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { ScreenShell } from '../../components/ScreenShell';

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });
  } catch {
    return 'Unknown date';
  }
};

export default function TripsScreen() {
  const { organizerId } = useAuth();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const loadTrips = async () => {
    if (!organizerId) {
      setError('Session expired. Please sign in.');
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setError(null);
    try {
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/api/v1/trips/organizer/${organizerId}`,
        {},
        10000
      );
      if (response.status === 404) {
        setTrips([]);
        return;
      }
      if (!response.ok) throw new Error('Failed to fetch archive');
      const data = await response.json();
      setTrips(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || 'Connection error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadTrips(); }, [organizerId]);

  const onRefresh = () => { setRefreshing(true); loadTrips(); };

  return (
    <ScreenShell>
      <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.preTitle}>HISTORY</Text>
            <Text style={styles.title}>Archive</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{trips.length}</Text>
          </View>
        </View>

        {/* List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {error ? (
            <View style={styles.stateContainer}>
              <Text style={styles.stateTitle}>Archive unavailable</Text>
              <Text style={styles.stateSub}>{error}</Text>
              <TouchableOpacity onPress={loadTrips} style={styles.retryBtn}>
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : loading ? (
            <View style={styles.stateContainer}>
              <Text style={styles.stateSub}>Accessing vault...</Text>
            </View>
          ) : trips.length === 0 ? (
            <View style={styles.stateContainer}>
              <Text style={styles.stateIcon}>📁</Text>
              <Text style={styles.stateTitle}>No history yet</Text>
              <Text style={styles.stateSub}>Your completed journeys will be archived here.</Text>
            </View>
          ) : (
            trips.map((trip) => (
              <TouchableOpacity 
                key={trip.id} 
                style={styles.card}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <View style={[
                    styles.statusPill,
                    { backgroundColor: trip.is_active ? 'rgba(46, 204, 113, 0.1)' : colors.bgElevated }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: trip.is_active ? colors.success : colors.textMuted }
                    ]}>
                      {trip.is_active ? 'ACTIVE' : 'ARCHIVED'}
                    </Text>
                  </View>
                  <Text style={styles.dateText}>{formatDate(trip.created_at)}</Text>
                </View>

                <Text style={styles.tripCode}>{trip.invite_code}</Text>
                
                <View style={styles.cardFooter}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaIcon}>👥</Text>
                    <Text style={styles.metaVal}>{trip.attendee_count ?? 0}</Text>
                    <Text style={styles.metaLabel}>Guests</Text>
                  </View>
                  <View style={styles.metaDivider} />
                  <View style={styles.metaItem}>
                    <Text style={styles.metaIcon}>📸</Text>
                    <Text style={styles.metaVal}>{trip.media_count ?? 0}</Text>
                    <Text style={styles.metaLabel}>Photos</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </Animated.View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  inner: { flex: 1, paddingTop: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 32,
  },
  preTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  badge: {
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  list: {
    paddingBottom: 120,
    gap: 20,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: 24,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  dateText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  tripCode: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 4,
    marginBottom: 24,
  },
  cardFooter: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    padding: 12,
  },
  metaItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  metaIcon: { fontSize: 14 },
  metaVal: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  metaLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  metaDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  stateContainer: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  stateIcon: { fontSize: 48, marginBottom: 12 },
  stateTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  stateSub: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  retryBtn: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  retryText: {
    color: colors.primary,
    fontWeight: '700',
  },
});
