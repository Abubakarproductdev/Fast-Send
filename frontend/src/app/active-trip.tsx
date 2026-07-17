import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
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
  const { activeTripId, setActiveTripId } = useAuth();
  
  const [inviteCode, setInviteCode] = useState('LOADING...');
  const [guests, setGuests] = useState(0);
  const [photos, setPhotos] = useState(0);

  useEffect(() => {
    const loadStats = async () => {
      if (!activeTripId) return;
      try {
        const response = await fetch(`http://localhost:8000/api/v1/trips/${activeTripId}`);
        if (!response.ok) return;
        const data = await response.json();
        setInviteCode(data.invite_code);
        setGuests(data.attendee_count);
        setPhotos(data.media_count);
      } catch (e) {
        console.error('Failed to load trip stats', e);
      }
    };
    loadStats();
    // In a real app, you might want to poll this endpoint every X seconds to keep it fresh
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, [activeTripId]);

  const handleEndTrip = async () => {
    Alert.alert(
      "End Trip",
      "Are you sure you want to end this trip? You won't be able to upload more photos.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "End Trip", 
          style: "destructive",
          onPress: async () => {
            if (!activeTripId) return;
            try {
              await fetch(`http://localhost:8000/api/v1/trips/${activeTripId}/end`, {
                method: 'POST'
              });
              await setActiveTripId(null);
              router.replace('/(tabs)');
            } catch (e: any) {
              Alert.alert('Error', 'Failed to end trip: ' + e.message);
            }
          }
        }
      ]
    );
  };

  const yellowContent = (
    <View style={styles.yellowContent}>
      <Text style={styles.liveText}>Trip is Live</Text>
      
      <View style={styles.qrCard}>
        {inviteCode !== 'LOADING...' ? (
          <QRCode value={`http://localhost:8000/join/${inviteCode}`} size={180} />
        ) : (
          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrPlaceholderText}>QR CODE</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.inviteCode}>{inviteCode}</Text>
    </View>
  );

  const whiteContent = (
    <View style={styles.whiteContent}>
      <Text style={styles.heading}>Live Event</Text>
      <Text style={styles.subtitle}>Share this QR with your guests to let them register</Text>

      <View style={styles.statsRow}>
        <StatBadge value={guests} label="Guests" />
        <StatBadge value={photos} label="Photos" />
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
          onPress={handleEndTrip} 
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
