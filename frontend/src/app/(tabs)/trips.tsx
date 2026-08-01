import { API_BASE_URL } from '../../config/api';
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Animated, SafeAreaView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
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
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const loadTrips = async () => {
    if (!organizerId) {
      setError('Not logged in. Please sign in again.');
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/trips/organizer/${organizerId}`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (response.status === 404) {
        setTrips([]);
        return;
      }
      if (!response.ok) {
        throw new Error(`Server error (${response.status}). Pull to refresh.`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('Unexpected response from server.');
      setTrips(data);
    } catch (e: any) {
      if (e.name === 'AbortError') {
        setError('Request timed out. Check your network and pull to refresh.');
      } else {
        setError(e.message || 'Failed to load trips. Pull to refresh.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadTrips(); }, [organizerId]);

  const onRefresh = () => { setRefreshing(true); loadTrips(); };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.heading}>Trip Archive</Text>
            <Text style={styles.subheading}>
              {loading ? 'Loading...' : `${trips.length} trip${trips.length !== 1 ? 's' : ''} total`}
            </Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{trips.length}</Text>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.amber}
              colors={[colors.amber]}
            />
          }
        >
          {error ? (
            <View style={styles.errorState}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorTitle}>Something went wrong</Text>
              <Text style={styles.errorSub}>{error}</Text>
              <TouchableOpacity onPress={loadTrips} style={styles.retryBtn}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Loading trips...</Text>
            </View>
          ) : trips.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📁</Text>
              <Text style={styles.emptyTitle}>No trips yet</Text>
              <Text style={styles.emptySub}>Trips you create will appear here after they end</Text>
            </View>
          ) : (
            trips.map((trip, index) => (
              <View key={trip.id} style={styles.tripCard}>
                {/* Status row */}
                <View style={styles.tripHeader}>
                  <View style={[
                    styles.statusPill,
                    { backgroundColor: trip.is_active ? colors.successLight : colors.bgElevated },
                  ]}>
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: trip.is_active ? colors.success : colors.textMuted },
                    ]} />
                    <Text style={[
                      styles.statusText,
                      { color: trip.is_active ? colors.success : colors.textMuted },
                    ]}>
                      {trip.is_active ? 'Live' : 'Ended'}
                    </Text>
                  </View>
                  <Text style={styles.tripDate}>{formatDate(trip.created_at)}</Text>
                </View>

                {/* Code */}
                <Text style={styles.tripCode}>{trip.invite_code}</Text>

                {/* Meta row */}
                <View style={styles.tripMeta}>
                  <Text style={styles.tripMetaItem}>👥 {trip.attendee_count ?? '—'} guests</Text>
                  <Text style={styles.tripMetaDot}>·</Text>
                  <Text style={styles.tripMetaItem}>📸 {trip.media_count ?? '—'} photos</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  heading: {
    fontSize: typography.size.xxl,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  countBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.amberGlow,
    borderWidth: 1,
    borderColor: colors.amber + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countBadgeText: {
    fontSize: typography.size.md,
    fontWeight: '800',
    color: colors.amber,
  },
  listContainer: {
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  tripCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: typography.size.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tripDate: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
  },
  tripCode: {
    fontSize: typography.size.xl,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 4,
    fontFamily: 'monospace',
  },
  tripMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tripMetaItem: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  tripMetaDot: {
    color: colors.textMuted,
  },
  // States
  emptyState: {
    alignItems: 'center',
    paddingTop: spacing.xxxl,
    gap: spacing.sm,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: {
    fontSize: typography.size.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.size.base,
    marginTop: spacing.xxl,
    textAlign: 'center',
  },
  errorState: {
    alignItems: 'center',
    paddingTop: spacing.xxxl,
    gap: spacing.sm,
  },
  errorIcon: { fontSize: 40 },
  errorTitle: {
    fontSize: typography.size.xl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  errorSub: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  retryBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryBtnText: {
    color: colors.amber,
    fontWeight: '700',
    fontSize: typography.size.base,
  },
});
