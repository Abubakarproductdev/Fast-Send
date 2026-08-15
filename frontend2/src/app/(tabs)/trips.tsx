import { API_BASE_URL } from '../../config/api';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, SafeAreaView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius, shadows } from '../../theme/spacing';

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch {
    return 'Unknown date';
  }
};

// ─── Shimmer skeleton card ────────────────────────────────────────────────────
const SkeletonCard = ({ delay }: { delay: number }) => {
  const opacity = useSharedValue(0.3);
  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.7, { duration: 700, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.3, { duration: 700, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      ),
    );
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={[styles.skeletonCard, style]}>
      <View style={styles.skeletonRow}>
        <View style={styles.skeletonPill} />
        <View style={styles.skeletonDate} />
      </View>
      <View style={styles.skeletonCode} />
      <View style={styles.skeletonMeta} />
    </Animated.View>
  );
};

// ─── Trip card ────────────────────────────────────────────────────────────────
const TripCard = ({ trip, index }: { trip: any; index: number }) => {
  const opacity = useSharedValue(0);
  const ty = useSharedValue(20);
  useEffect(() => {
    opacity.value = withDelay(index * 60, withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) }));
    ty.value = withDelay(index * 60, withSpring(0, { damping: 22, stiffness: 200 }));
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));

  return (
    <Animated.View style={[styles.tripCard, style]}>
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

      {/* Invite code */}
      <Text style={styles.tripCode}>{trip.invite_code}</Text>

      {/* Meta row */}
      <View style={styles.tripMeta}>
        <Ionicons name="people-outline" size={13} color={colors.textSecondary} />
        <Text style={styles.tripMetaItem}>{trip.attendee_count ?? '-'} guests</Text>
        <View style={styles.tripMetaDot} />
        <Ionicons name="images-outline" size={13} color={colors.textSecondary} />
        <Text style={styles.tripMetaItem}>{trip.media_count ?? '-'} photos</Text>
      </View>
    </Animated.View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function TripsScreen() {
  const { organizerId } = useAuth();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headerOpacity = useSharedValue(0);
  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
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
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/api/v1/trips/organizer/${organizerId}`,
        {},
        10000
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
      {/* Subtle gradient */}
      <LinearGradient
        colors={['rgba(196,241,53,0.03)', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.3 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <View>
          <Text style={styles.heading}>Trip Archive</Text>
          <Text style={styles.subheading}>
            {loading ? 'Loading...' : `${trips.length} trip${trips.length !== 1 ? 's' : ''} total`}
          </Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{trips.length}</Text>
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.lime}
            colors={[colors.lime]}
          />
        }
      >
        {error ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="warning-outline" size={40} color={colors.error} />
            </View>
            <Text style={styles.emptyTitle}>Something went wrong</Text>
            <Text style={styles.emptySub}>{error}</Text>
            <TouchableOpacity onPress={loadTrips} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <>
            <SkeletonCard delay={0} />
            <SkeletonCard delay={80} />
            <SkeletonCard delay={160} />
          </>
        ) : trips.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="folder-open-outline" size={48} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No trips yet</Text>
            <Text style={styles.emptySub}>
              Trips you create will appear here after they end.
            </Text>
          </View>
        ) : (
          trips.map((trip, index) => (
            <TripCard key={trip.id} trip={trip} index={index} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    marginTop: 30,
  },
  heading: {
    fontSize: typography.size.xxl,
    fontFamily: typography.fontExtraBold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: typography.size.sm,
    fontFamily: typography.fontRegular,
    color: colors.textSecondary,
    marginTop: 2,
  },
  countBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.limeGlow,
    borderWidth: 1,
    borderColor: 'rgba(196,241,53,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countBadgeText: {
    fontSize: typography.size.md,
    fontFamily: typography.fontExtraBold,
    color: colors.lime,
  },

  listContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 105,
    gap: spacing.md,
    paddingTop: spacing.sm,
  },

  // Trip card
  tripCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.sm,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    gap: 6,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: {
    fontSize: typography.size.xs,
    fontFamily: typography.fontBold,
    letterSpacing: 0.5,
  },
  tripDate: {
    fontSize: typography.size.xs,
    fontFamily: typography.fontRegular,
    color: colors.textMuted,
  },
  tripCode: {
    fontSize: typography.size.xl,  // 24px — monospace invite code
    fontFamily: typography.fontMono,
    color: colors.lime,
    letterSpacing: 6,
  },
  tripMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tripMetaItem: {
    fontSize: typography.size.sm,
    fontFamily: typography.fontRegular,
    color: colors.textSecondary,
  },
  tripMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textMuted,
    marginHorizontal: 2,
  },

  // Empty / error states
  emptyState: {
    alignItems: 'center',
    paddingTop: spacing.xxxl,
    gap: spacing.md,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: radius.lg,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.size.xl,
    fontFamily: typography.fontBold,
    color: colors.textPrimary,
  },
  emptySub: {
    fontSize: typography.size.base,
    fontFamily: typography.fontRegular,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    lineHeight: 22,
  },
  retryBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryBtnText: {
    color: colors.lime,
    fontFamily: typography.fontBold,
    fontSize: typography.size.base,
  },

  // Skeleton cards
  skeletonCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: 12,
  },
  skeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonPill: {
    width: 56,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.bgElevated,
  },
  skeletonDate: {
    width: 80,
    height: 14,
    borderRadius: radius.xs,
    backgroundColor: colors.bgElevated,
  },
  skeletonCode: {
    width: '60%',
    height: 26,
    borderRadius: radius.xs,
    backgroundColor: colors.bgElevated,
  },
  skeletonMeta: {
    width: '40%',
    height: 14,
    borderRadius: radius.xs,
    backgroundColor: colors.bgElevated,
  },
});
