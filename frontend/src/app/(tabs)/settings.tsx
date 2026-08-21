import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { ScreenShell } from '../../components/ScreenShell';

const SettingRow = ({
  label, value, onPress, danger, disabled,
}: {
  label: string; value?: string; onPress?: () => void;
  danger?: boolean; disabled?: boolean;
}) => (
  <TouchableOpacity
    style={[styles.row, disabled && styles.rowDisabled]}
    onPress={onPress}
    disabled={disabled || !onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.rowLabel, danger && styles.dangerText, disabled && styles.rowLabelDisabled]}>
      {label}
    </Text>
    {value && <Text style={styles.rowValue}>{value}</Text>}
    {!value && onPress && <Text style={styles.rowChevron}>→</Text>}
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const router = useRouter();
  const { user, setOrganizerId, setActiveTripId, setTripStartTime } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const displayName = user?.displayName || 'Organizer';
  const email = user?.email || 'No email';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to end your session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              setOrganizerId(null);
              await setActiveTripId(null);
              await setTripStartTime(null);
              router.replace('/login');
            } catch (e: any) {
              Alert.alert('Error', 'Sign out failed');
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenShell>
      <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.preTitle}>PREFERENCES</Text>
            <Text style={styles.title}>Profile</Text>
          </View>

          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
              <View style={styles.avatarGlow} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.displayName}>{displayName}</Text>
              <Text style={styles.emailText}>{email}</Text>
            </View>
          </View>

          {/* Sections */}
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.section}>
            <SettingRow label="Sync Interval" value="2 Hours" />
            <SettingRow label="Upload Mode" value="Wi-Fi Only" />
            <SettingRow label="Image Quality" value="High (1080p)" />
          </View>

          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.section}>
            <SettingRow label="Display Name" value={displayName} />
            <SettingRow label="Update Password" onPress={() => {}} />
          </View>

          <Text style={styles.sectionTitle}>Legal</Text>
          <View style={styles.section}>
            <SettingRow label="Terms of Service" onPress={() => {}} />
            <SettingRow label="Privacy Policy" onPress={() => {}} />
            <SettingRow label="App Version" value="1.0.0" />
          </View>

          <View style={styles.signOutWrapper}>
            <TouchableOpacity 
              onPress={handleSignOut} 
              style={styles.signOutBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.signOutText}>Sign Out Session</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </Animated.View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  inner: { flex: 1, paddingTop: 20 },
  scroll: { paddingBottom: 120 },
  header: {
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: 24,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    marginBottom: 40,
    gap: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.primary,
    zIndex: 2,
  },
  avatarGlow: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryGlow,
    zIndex: 1,
  },
  profileInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  emailText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.textGold,
    letterSpacing: 2,
    marginBottom: 12,
    marginTop: 8,
  },
  section: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    overflow: 'hidden',
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowDisabled: { opacity: 0.5 },
  rowLabel: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  rowLabelDisabled: { color: colors.textMuted },
  rowValue: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  rowChevron: {
    fontSize: 18,
    color: colors.textMuted,
    fontWeight: '700',
  },
  dangerText: { color: colors.error },
  signOutWrapper: {
    marginTop: 16,
  },
  signOutBtn: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderRadius: radius.md,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(231, 76, 60, 0.2)',
  },
  signOutText: {
    color: colors.error,
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
