import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

export default function TripsScreen() {
  const { organizerId } = useAuth();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTrips = async () => {
    if (!organizerId) return;
    try {
      const response = await fetch(`http://localhost:8000/api/v1/trips/organizer/${organizerId}`);
      if (response.ok) {
        const data = await response.json();
        setTrips(data);
      }
    } catch (e) {
      console.error('Failed to load trips', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTrips();
  }, [organizerId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTrips();
  };

  const yellowContent = (
    <View style={styles.yellowContent}>
      <Text style={typography.h2}>Your Trips</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{trips.length}</Text>
      </View>
    </View>
  );

  const whiteContent = (
    <ScrollView 
      style={styles.whiteContent}
      contentContainerStyle={styles.listContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {loading ? (
        <Text style={styles.emptyText}>Loading...</Text>
      ) : trips.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📁</Text>
          <Text style={styles.emptyTitle}>No past trips yet</Text>
          <Text style={styles.emptySub}>Completed trips will appear here</Text>
        </View>
      ) : (
        trips.map((trip) => (
          <TouchableOpacity key={trip.id} style={styles.tripCard}>
            <View style={styles.tripHeader}>
              <Text style={typography.bodyBold}>Code: {trip.invite_code}</Text>
              <View style={[
                styles.statusBadge, 
                { backgroundColor: trip.is_active ? colors.success : colors.offWhite }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: trip.is_active ? colors.white : colors.textSecondary }
                ]}>
                  {trip.is_active ? 'Live' : 'Ended'}
                </Text>
              </View>
            </View>
            
            <View style={styles.tripStats}>
              <Text style={typography.caption}>Created: {new Date(trip.created_at).toLocaleDateString()}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );

  return (
    <HalfHalfLayout 
      yellowContent={yellowContent} 
      whiteContent={whiteContent} 
    />
  );
}

const styles = StyleSheet.create({
  yellowContent: {
    alignItems: 'center',
    width: '100%',
  },
  badge: {
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginTop: spacing.sm,
  },
  badgeText: {
    fontSize: typography.size.sm,
    fontWeight: 'bold',
    color: colors.primary,
  },
  whiteContent: {
    flex: 1,
  },
  listContainer: {
    paddingBottom: spacing.xl,
  },
  tripCard: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: typography.size.xs,
    fontWeight: 'bold',
  },
  tripStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptySub: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: spacing.xl,
    color: colors.textSecondary,
  }
});
