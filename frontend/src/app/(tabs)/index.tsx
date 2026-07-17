import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { HalfHalfLayout } from '../../components/HalfHalfLayout';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

const StatBadge = ({ value, label }: { value: string | number, label: string }) => (
  <View style={styles.statBadge}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export default function HomeScreen() {
  const router = useRouter();
  const { activeTripId } = useAuth();

  const yellowContent = (
    <View style={styles.yellowContent}>
      <Text style={styles.greeting}>Dashboard</Text>
      <Text style={styles.dateSubtitle}>
        {activeTripId ? 'You have an active trip running.' : "You're all caught up. Start a new trip to begin."}
      </Text>
      
      <View style={styles.heroIconContainer}>
        <Text style={styles.heroIcon}>📷</Text>
        {!activeTripId && <Text style={styles.heroSubtext}>No active trip</Text>}
      </View>
    </View>
  );

  const whiteContent = (
    <View style={styles.whiteContent}>
      {activeTripId ? (
        <>
          <Text style={styles.tripName}>Live Event Active</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>

          <View style={{ flex: 1, justifyContent: 'center' }}>
            <PrimaryButton 
              title="Push New Photos" 
              onPress={() => alert('Scanning delta...')} 
            />
            <PrimaryButton 
              title="View Trip Stats" 
              type="secondary"
              onPress={() => router.push('/active-trip')} 
            />
          </View>
        </>
      ) : (
        <>
          <Text style={styles.heading}>Start your first trip</Text>
          <Text style={styles.subtitle}>Create a trip and share your QR code with guests</Text>

          <PrimaryButton 
            title="Start New Trip" 
            onPress={() => router.push('/create-trip')} 
          />

          <View style={styles.statsRow}>
            <StatBadge value="-" label="Total Trips" />
            <StatBadge value="-" label="Total Photos" />
            <StatBadge value="-" label="Total Guests" />
          </View>
        </>
      )}
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
    width: '100%',
  },
  greeting: {
    fontSize: typography.size.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  dateSubtitle: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
  },
  heroIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIcon: {
    fontSize: 64,
  },
  heroSubtext: {
    marginTop: spacing.md,
    fontSize: typography.size.md,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  whiteContent: {
    flex: 1,
  },
  heading: {
    fontSize: typography.size.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
  },
  statBadge: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: typography.size.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  tripName: {
    fontSize: typography.size.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.yellowLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.warning,
    marginRight: 6,
  },
  liveText: {
    fontSize: typography.size.xs,
    fontWeight: 'bold',
    color: colors.warning,
  }
});
