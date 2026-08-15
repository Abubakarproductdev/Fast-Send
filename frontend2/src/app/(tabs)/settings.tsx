import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, SafeAreaView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius, shadows } from '../../theme/spacing';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface SettingRowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  disabled?: boolean;
  iconName?: IoniconName;
  isLast?: boolean;
}

const SettingRow = ({
  label, value, onPress, danger, disabled, iconName, isLast,
}: SettingRowProps) => (
  <TouchableOpacity
    style={[styles.row, !isLast && styles.rowBorder, disabled && styles.rowDisabled]}
    onPress={onPress}
    disabled={disabled || !onPress}
    activeOpacity={0.7}
  >
    <View style={styles.rowLeft}>
      {iconName && (
        <Ionicons
          name={iconName}
          size={18}
          color={danger ? colors.error : colors.textSecondary}
          style={styles.rowIcon}
        />
      )}
      <Text style={[
        styles.rowLabel,
        danger && styles.dangerText,
        disabled && styles.rowLabelDisabled,
      ]}>
        {label}
      </Text>
    </View>
    {value ? (
      <Text style={styles.rowValue}>{value}</Text>
    ) : onPress ? (
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    ) : null}
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const router = useRouter();
  const { user, setOrganizerId, setActiveTripId, setTripStartTime } = useAuth();

  const opacity = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
  }, []);

  const displayName = (user as any)?.displayName || 'Organizer';
  const email = (user as any)?.email || 'No email';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

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
      <LinearGradient
        colors={['rgba(196,241,53,0.03)', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.3 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <Animated.View style={[styles.inner, animStyle]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* Page title */}
          <Text style={styles.pageTitle}>Settings</Text>

          {/* Profile card */}
          <View style={styles.profileCard}>
            <LinearGradient
              colors={['rgba(196,241,53,0.10)', 'rgba(196,241,53,0.03)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.displayName}>{displayName}</Text>
              <Text style={styles.emailText}>{email}</Text>
            </View>
            <View style={styles.profileBadge}>
              <Ionicons name="checkmark-circle" size={18} color={colors.lime} />
            </View>
          </View>

          {/* Upload Settings */}
          <Text style={styles.sectionTitle}>Upload</Text>
          <View style={styles.section}>
            <SettingRow
              label="Reminder Interval"
              value="Every 2 hours"
              iconName="time-outline"
            />
            <SettingRow
              label="Upload on Wi-Fi Only"
              value="On"
              iconName="wifi-outline"
            />
            <SettingRow
              label="Proxy Quality"
              value="1080px / 70%"
              iconName="image-outline"
              isLast
            />
          </View>

          {/* Account */}
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.section}>
            <SettingRow
              label="Display Name"
              value={displayName}
              iconName="person-outline"
            />
            <SettingRow
              label="Change Password"
              iconName="lock-closed-outline"
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
              isLast
            />
          </View>

          {/* About */}
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.section}>
            <SettingRow
              label="Version"
              value="1.0.0"
              iconName="information-circle-outline"
            />
            <SettingRow
              label="Terms of Service"
              iconName="document-text-outline"
              onPress={() => {}}
            />
            <SettingRow
              label="Privacy Policy"
              iconName="shield-outline"
              onPress={() => {}}
              isLast
            />
          </View>

          {/* Danger Zone */}
          <Text style={[styles.sectionTitle, styles.dangerSectionTitle]}>Danger Zone</Text>
          <View style={styles.section}>
            <SettingRow
              label="Sign Out"
              danger
              iconName="log-out-outline"
              onPress={handleSignOut}
              isLast
            />
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
    paddingTop: spacing.lg,
    paddingBottom: 105,
  },
  pageTitle: {
    fontSize: typography.size.xxl,
    fontFamily: typography.fontExtraBold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: spacing.xl,
    marginTop: 30,
  },
  profileCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(196,241,53,0.15)',
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
    overflow: 'hidden',
    ...shadows.sm,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: 'rgba(196,241,53,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(196,241,53,0.40)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: typography.size.lg,
    fontFamily: typography.fontExtraBold,
    color: colors.lime,
  },
  profileInfo: { flex: 1, gap: 2 },
  displayName: {
    fontSize: typography.size.md,
    fontFamily: typography.fontBold,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  emailText: {
    fontSize: typography.size.sm,
    fontFamily: typography.fontRegular,
    color: colors.textSecondary,
  },
  profileBadge: {
    flexShrink: 0,
  },
  sectionTitle: {
    fontSize: typography.size.xs,
    fontFamily: typography.fontBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  dangerSectionTitle: {
    color: colors.error + 'AA',
  },
  section: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowIcon: {
    marginRight: spacing.sm,
  },
  rowDisabled: { opacity: 0.4 },
  rowLabel: {
    fontSize: typography.size.base,
    fontFamily: typography.fontMedium,
    color: colors.textPrimary,
  },
  rowLabelDisabled: { color: colors.textMuted },
  rowValue: {
    fontSize: typography.size.sm,
    fontFamily: typography.fontRegular,
    color: colors.textSecondary,
  },
  dangerText: {
    color: colors.error,
    fontFamily: typography.fontBold,
  },
});
