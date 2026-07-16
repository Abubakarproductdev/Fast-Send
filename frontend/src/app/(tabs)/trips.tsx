import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { HalfHalfLayout } from '../../components/HalfHalfLayout';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

const MOCK_TRIPS = [
  { id: '1', name: 'Lahore Trip', date: 'Jul 14 - Jul 16', photos: 142 },
  { id: '2', name: 'Birthday Party', date: 'Jun 22', photos: 45 },
];

export default function TripsScreen() {
  const router = useRouter();

  const yellowContent = (
    <View style={styles.yellowContent}>
      <Text style={styles.title}>Your Trips</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{MOCK_TRIPS.length}</Text>
      </View>
    </View>
  );

  const whiteContent = (
    <View style={styles.whiteContent}>
      <FlatList
        data={MOCK_TRIPS}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card}
            onPress={() => router.push(`/trip-detail/${item.id}`)}
          >
            <View>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardDate}>{item.date}</Text>
            </View>
            <View style={styles.photoCount}>
              <Text style={styles.photoCountText}>{item.photos} photos</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📁</Text>
            <Text style={styles.emptyTitle}>No past trips yet</Text>
            <Text style={styles.emptySub}>Completed trips will appear here</Text>
          </View>
        }
      />
    </View>
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
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  badge: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginTop: spacing.md,
  },
  badgeText: {
    fontWeight: 'bold',
  },
  whiteContent: {
    flex: 1,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: typography.size.base,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  cardDate: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  photoCount: {
    backgroundColor: colors.yellowLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  photoCountText: {
    color: colors.yellowDark,
    fontSize: typography.size.xs,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  emptySub: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  }
});
