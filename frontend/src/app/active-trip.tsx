import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { HalfHalfLayout } from '../components/HalfHalfLayout';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

const StatBadge = ({ value, label }: { value: string | number, label: string }) => (
  <View style={styles.statBadge}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export default function ActiveTripScreen() {
  const router = useRouter();

  const yellowContent = (
    <View style={styles.yellowContent}>
      <Text style={styles.liveText}>Trip is Live</Text>
      
      <View style={styles.qrCard}>
        {/* Placeholder for actual QR code component */}
        <View style={styles.qrPlaceholder}>
          <Text style={styles.qrPlaceholderText}>QR CODE</Text>
        </View>
      </View>
      
      <Text style={styles.inviteCode}>FA3B2C89</Text>
    </View>
  );

  const whiteContent = (
    <View style={styles.whiteContent}>
      <Text style={styles.heading}>Ahmed's Wedding</Text>
      <Text style={styles.subtitle}>Share this QR with your guests to let them register</Text>

      <View style={styles.statsRow}>
        <StatBadge value="14" label="Guests" />
        <StatBadge value="102" label="Photos" />
        <StatBadge value="3" label="Videos" />
      </View>

      <View style={styles.buttonContainer}>
        <PrimaryButton 
          title="Push Photos Now" 
          onPress={() => alert('Uploading...')} 
        />
        <PrimaryButton 
          title="Share Invite Link" 
          type="secondary"
          onPress={() => alert('Share sheet opened')} 
        />
        <PrimaryButton 
          title="End Trip" 
          type="danger"
          onPress={() => router.replace('/(tabs)')} 
        />
      </View>
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
  liveText: {
    fontSize: typography.size.md,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  qrCard: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: spacing.lg,
  },
  qrPlaceholder: {
    width: 180,
    height: 180,
    backgroundColor: colors.divider,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrPlaceholderText: {
    color: colors.textSecondary,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  inviteCode: {
    fontSize: 40,
    fontWeight: 'bold',
    letterSpacing: 8,
    color: colors.textPrimary,
    fontFamily: 'monospace',
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
    marginBottom: spacing.xxl,
  },
  statBadge: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: colors.offWhite,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.divider,
    marginHorizontal: 4,
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
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  }
});
