import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api, OrganizerProfile } from '../services/api';
import { radius, spacing } from '../theme/spacing';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenShell } from '../components/ScreenShell';
import { UserAvatar } from '../components/UserAvatar';

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, organizerId, refreshUser } = useAuth();
  const styles = makeStyles(colors);
  const [profile, setProfile] = useState<OrganizerProfile | null>(null);
  const [name, setName] = useState(user?.displayName || '');
  const [nameError, setNameError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    if (!organizerId) return;
    api.getOrganizerProfile(organizerId)
      .then((nextProfile) => {
        setProfile(nextProfile);
        setName(nextProfile.name || user?.displayName || '');
      })
      .catch(() => {
        // Firebase remains the source of truth for an offline profile view.
      });
  }, [organizerId, user?.displayName]);

  const saveProfile = async () => {
    const nextName = name.trim();
    if (!nextName) {
      setNameError('Display name is required.');
      return;
    }
    if (nextName.length > 100) {
      setNameError('Display name must be 100 characters or fewer.');
      return;
    }
    if (!auth.currentUser) {
      Alert.alert('Session expired', 'Please sign in again before updating your profile.');
      return;
    }

    setNameError('');
    setProfileSaving(true);
    try {
      const nextPhotoUrl = auth.currentUser.photoURL;
      const saved = organizerId
        ? await api.updateOrganizerProfile(organizerId, nextName, nextPhotoUrl)
        : null;
      await updateProfile(auth.currentUser, { displayName: nextName });
      await refreshUser();
      if (saved) setProfile(saved);
      Alert.alert('Profile updated', 'Your display name has been saved.');
    } catch (error: any) {
      Alert.alert('Could not update profile', error?.message || 'Please try again.');
    } finally {
      setProfileSaving(false);
    }
  };

  const changePassword = async () => {
    if (!auth.currentUser?.email) {
      Alert.alert('No email found', 'Please sign in again before changing your password.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Password too short', 'Use at least 6 characters for your new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Enter the same new password in both fields.');
      return;
    }
    if (!currentPassword) {
      Alert.alert('Current password required', 'Enter your current password to continue securely.');
      return;
    }

    setPasswordSaving(true);
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Password updated', 'Your password has been changed successfully.');
    } catch (error: any) {
      const message = error?.code === 'auth/invalid-credential' || error?.code === 'auth/wrong-password'
        ? 'The current password is incorrect.'
        : error?.message || 'Please try again.';
      Alert.alert('Could not update password', message);
    } finally {
      setPasswordSaving(false);
    }
  };

  const sendResetLink = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      Alert.alert('Reset link sent', `A password reset link was sent to ${user.email}.`);
    } catch {
      Alert.alert('Could not send reset link', 'Please try again in a moment.');
    }
  };

  const displayName = name.trim() || profile?.name || user?.email?.split('@')[0] || 'Organizer';
  const email = profile?.email || user?.email || 'No email available';
  const photoUrl = profile?.photo_url || user?.photoURL;

  return (
    <ScreenShell>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Go back">
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.topBarTitle}>Account</Text>
            <View style={styles.topBarSpacer} />
          </View>

          <View style={styles.hero}>
            <UserAvatar name={displayName} imageUrl={photoUrl} size={82} />
            <Text style={styles.heroName}>{displayName}</Text>
            <Text style={styles.heroEmail}>{email}</Text>
            <View style={styles.accountPill}>
              <Ionicons name="shield-checkmark-outline" size={13} color={colors.primaryDark} />
              <Text style={styles.accountPillText}>ORGANIZER ACCOUNT</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>PROFILE DETAILS</Text>
          <View style={styles.card}>
            <InputField
              label="Display name"
              placeholder="Your name"
              value={name}
              onChangeText={(value) => { setName(value); setNameError(''); }}
              autoCapitalize="words"
              maxLength={100}
              error={nameError}
            />
            <View style={styles.readOnlyRow}>
              <View style={styles.readOnlyIcon}><Ionicons name="mail-outline" size={17} color={colors.textSecondary} /></View>
              <View style={styles.readOnlyCopy}><Text style={styles.readOnlyLabel}>Email address</Text><Text style={styles.readOnlyValue}>{email}</Text></View>
              <Text style={styles.readOnlyHint}>Managed by Firebase</Text>
            </View>
            <PrimaryButton title={profileSaving ? 'Saving profile...' : 'Save profile'} onPress={saveProfile} loading={profileSaving} disabled={profileSaving} style={styles.button} />
          </View>

          <Text style={styles.sectionTitle}>PASSWORD & SECURITY</Text>
          <View style={styles.card}>
            <Text style={styles.cardIntro}>Confirm your current password before setting a new one.</Text>
            <InputField label="Current password" placeholder="••••••••" secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} />
            <InputField label="New password" placeholder="At least 6 characters" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
            <InputField label="Confirm new password" placeholder="Repeat your new password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
            <PrimaryButton title={passwordSaving ? 'Updating password...' : 'Update password'} onPress={changePassword} loading={passwordSaving} disabled={passwordSaving} style={styles.button} />
            <TouchableOpacity onPress={sendResetLink} style={styles.resetLink}><Text style={styles.resetLinkText}>Send me a password reset link instead</Text><Ionicons name="arrow-forward" size={15} color={colors.primaryDark} /></TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>ACCOUNT INFORMATION</Text>
          <View style={styles.card}>
            <InfoRow label="Account status" value="Active" icon="checkmark-circle-outline" />
            <InfoRow label="Organizer ID" value={organizerId ? `${organizerId.slice(0, 8)}…` : 'Pending sync'} icon="finger-print-outline" />
            <InfoRow label="Profile photo" value={photoUrl ? 'Connected' : 'Initials fallback'} icon="image-outline" last />
          </View>

          <Text style={styles.securityNote}><Ionicons name="lock-closed-outline" size={14} color={colors.textMuted} /> Your password is handled by Firebase and is never stored in FastSend or MongoDB.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

function InfoRow({ label, value, icon, last = false }: { label: string; value: string; icon: React.ComponentProps<typeof Ionicons>['name']; last?: boolean }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return <View style={[styles.infoRow, !last && styles.infoRowBorder]}><View style={styles.infoIcon}><Ionicons name={icon} size={17} color={colors.primaryDark} /></View><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>;
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingTop: 8, paddingBottom: 48 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  backButton: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.border },
  topBarTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '800' },
  topBarSpacer: { width: 42 },
  hero: { alignItems: 'center', backgroundColor: colors.sageDark, borderRadius: radius.xl, padding: 25, marginBottom: 31 },
  heroName: { color: colors.paper, fontSize: 25, fontWeight: '800', marginTop: 14, marginBottom: 5 },
  heroEmail: { color: 'rgba(255,253,248,0.68)', fontSize: 13, marginBottom: 12 },
  accountPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.paper, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 6 },
  accountPillText: { color: colors.primaryDark, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  sectionTitle: { color: colors.textPrimary, fontSize: 10, fontWeight: '900', letterSpacing: 1.4, marginBottom: 10, marginTop: 4 },
  card: { backgroundColor: colors.paper, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 17, marginBottom: 25 },
  button: { marginBottom: 0 },
  readOnlyRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 14, marginBottom: 16, borderTopWidth: 1, borderTopColor: colors.divider },
  readOnlyIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center' },
  readOnlyCopy: { flex: 1 },
  readOnlyLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 },
  readOnlyValue: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  readOnlyHint: { color: colors.textMuted, fontSize: 9, maxWidth: 72, textAlign: 'right', lineHeight: 13 },
  cardIntro: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: 18 },
  resetLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 17 },
  resetLinkText: { color: colors.primaryDark, fontSize: 12, fontWeight: '800' },
  infoRow: { flexDirection: 'row', alignItems: 'center', minHeight: 58, gap: 11 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  infoIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { flex: 1, color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
  infoValue: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  securityNote: { color: colors.textMuted, fontSize: 11, lineHeight: 17, textAlign: 'center', paddingHorizontal: 15 },
});
