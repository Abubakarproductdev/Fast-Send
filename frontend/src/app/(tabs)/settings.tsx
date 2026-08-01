import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, SafeAreaView, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

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
    {!value && onPress && <Text style={styles.rowChevron}>›</Text>}
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const router = useRouter();
  const { user, setOrganizerId, setActiveTripId, setTripStartTime } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const displayName = user?.displayName || 'Organizer';
  const email = user?.email || 'No email';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              setOrganizerId(null);
              // Clear trip state on sign out
              await setActiveTripId(null);
              await setTripStartTime(null);
              router.replace('/login');
            } catch (e: any) {
              Alert.alert('Sign Out Failed', e.message || 'Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Profile header */}
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Text style={styles.displayName}>{displayName}</Text>
            <Text style={styles.emailText}>{email}</Text>
          </View>

          {/* Upload Settings */}
          <Text style={styles.sectionTitle}>Upload Settings</Text>
          <View style={styles.section}>
            <SettingRow label="Reminder Interval" value="Every 2 hours" />
            <SettingRow label="Upload on Wi-Fi Only" value="On" />
            <SettingRow label="Proxy Quality" value="1080px / 70%" />
          </View>

          {/* Account */}
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.section}>
            <SettingRow label="Display Name" value={displayName} />
            <SettingRow
              label="Change Password"
              onPress={() =>
                Alert.alert(
                  'Change Password',
                  'A password reset email will be sent to ' + email,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Send Email', onPress: () => {} },
                  ]
                )
              }
            />
          </View>

          {/* About */}
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.section}>
            <SettingRow label="Version" value="1.0.0" />
            <SettingRow label="Terms of Service" onPress={() => {}} />
            <SettingRow label="Privacy Policy" onPress={() => {}} />
          </View>

          {/* Danger */}
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.section}>
            <SettingRow label="Sign Out" danger onPress={handleSignOut} />
          </View>

        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: 0,
  },
  profileCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 26,
    backgroundColor: colors.amberGlow,
    borderWidth: 1.5,
    borderColor: colors.amber,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: {
    fontSize: typography.size.xl,
    fontWeight: '800',
    color: colors.amber,
  },
  displayName: {
    fontSize: typography.size.xl,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  emailText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontSize: typography.size.xs,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  section: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowDisabled: {
    opacity: 0.4,
  },
  rowLabel: {
    fontSize: typography.size.base,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  rowLabelDisabled: {
    color: colors.textMuted,
  },
  rowValue: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
  },
  rowChevron: {
    fontSize: typography.size.lg,
    color: colors.textMuted,
  },
  dangerText: {
    color: colors.error,
    fontWeight: '700',
  },
});
