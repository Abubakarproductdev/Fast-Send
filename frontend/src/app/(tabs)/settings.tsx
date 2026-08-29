import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Animated, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { radius } from '../../theme/spacing';
import { ScreenShell } from '../../components/ScreenShell';
import { UserAvatar } from '../../components/UserAvatar';
import { getOrganizerSettings, OrganizerSettings, SYNC_INTERVAL_OPTIONS, updateOrganizerSettings, UploadMode } from '../../services/OrganizerSettingsService';
import { scheduleUploadReminders } from '../../services/NotificationService';
import { SettingsChoiceModal } from '../../components/SettingsChoiceModal';

type SettingRowProps = { label: string; value?: string; onPress?: () => void; danger?: boolean; disabled?: boolean; icon: React.ComponentProps<typeof Ionicons>['name']; control?: React.ReactNode };

function SettingRow({ label, value, onPress, danger, disabled, icon, control }: SettingRowProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return <TouchableOpacity style={[styles.row, disabled && styles.rowDisabled]} onPress={onPress} disabled={disabled || (!onPress && !control)} activeOpacity={0.7}>
    <View style={[styles.rowIcon, danger && styles.rowIconDanger]}><Ionicons name={icon} size={17} color={danger ? colors.error : colors.textSecondary} /></View>
    <Text style={[styles.rowLabel, danger && styles.dangerText, disabled && styles.rowLabelDisabled]}>{label}</Text>
    {control || (value ? <Text style={styles.rowValue}>{value}</Text> : onPress ? <Ionicons name="chevron-forward" size={16} color={colors.textMuted} /> : null)}
  </TouchableOpacity>;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, organizerId, activeTripId, setOrganizerId, setActiveTripId, setTripStartTime } = useAuth();
  const styles = makeStyles(colors);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [settings, setSettings] = useState<OrganizerSettings>({ sync_interval_hours: 2, upload_mode: 'wifi_only' });
  const [saving, setSaving] = useState(false);
  const [choiceModal, setChoiceModal] = useState<'sync' | 'upload' | null>(null);

  useEffect(() => { Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start(); }, []);
  useEffect(() => { if (organizerId) getOrganizerSettings(organizerId).then(setSettings).catch(() => {}); }, [organizerId]);

  const saveSettings = async (patch: Partial<OrganizerSettings>) => {
    if (!organizerId) return;
    setSaving(true);
    try {
      const next = await updateOrganizerSettings(organizerId, patch);
      setSettings(next);
      if (patch.sync_interval_hours && activeTripId) scheduleUploadReminders(next.sync_interval_hours).catch(() => {});
    } catch (error: any) { Alert.alert('Could not save', error.message || 'Please try again.'); }
    finally { setSaving(false); }
  };
  const chooseSyncInterval = () => setChoiceModal('sync');
  const chooseUploadMode = () => setChoiceModal('upload');
  const selectChoice = (value: string) => {
    setChoiceModal(null);
    if (choiceModal === 'sync') saveSettings({ sync_interval_hours: Number(value) });
    if (choiceModal === 'upload') saveSettings({ upload_mode: value as UploadMode });
  };
  const handleSignOut = () => Alert.alert('Sign out', 'Are you sure you want to end your session?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Sign out', style: 'destructive', onPress: async () => { try { await signOut(auth); setOrganizerId(null); await setActiveTripId(null); await setTripStartTime(null); router.replace('/login'); } catch { Alert.alert('Error', 'Sign out failed'); } } },
  ]);

  const displayName = user?.displayName || 'Organizer';
  const email = user?.email || 'No email';
  const uploadLabel = settings.upload_mode === 'wifi_and_cellular' ? 'Wi-Fi + cellular' : 'Wi-Fi only';

  const syncChoices = SYNC_INTERVAL_OPTIONS.map((hours) => ({ value: String(hours), title: `${hours} hour${hours === 1 ? '' : 's'}`, description: hours === 1 ? 'A gentle nudge every hour while you are capturing.' : `A calm reminder every ${hours} hours while your trip is live.`, icon: 'time-outline' as const }));
  const uploadChoices = [
    { value: 'wifi_only', title: 'Wi-Fi only', description: 'Save mobile data and sync when a Wi-Fi connection is available.', icon: 'wifi-outline' as const },
    { value: 'wifi_and_cellular', title: 'Wi-Fi + cellular', description: 'Keep photos moving even when Wi-Fi is not available.', icon: 'swap-horizontal-outline' as const },
  ];

  return <ScreenShell><Animated.View style={[styles.inner, { opacity: fadeAnim }]}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
    <View style={styles.header}><Text style={styles.eyebrow}>YOUR SPACE</Text><Text style={styles.title}>Profile</Text></View>
    <TouchableOpacity style={styles.profileCard} onPress={() => router.push('/profile')} activeOpacity={0.85}><UserAvatar name={displayName} imageUrl={user?.photoURL} size={62} /><View style={styles.profileInfo}><Text style={styles.displayName}>{displayName}</Text><Text style={styles.emailText}>{email}</Text><View style={styles.memberPill}><Ionicons name="sparkles-outline" size={12} color={colors.primaryDark} /><Text style={styles.memberText}>ORGANIZER ACCOUNT</Text></View></View><Ionicons name="chevron-forward" size={18} color="rgba(255,253,248,0.7)" /></TouchableOpacity>
    <Text style={styles.sectionTitle}>WORKFLOW</Text><View style={styles.section}>
      <SettingRow icon="time-outline" label="Sync interval" value={saving ? 'Saving…' : `${settings.sync_interval_hours} hour${settings.sync_interval_hours === 1 ? '' : 's'}`} onPress={chooseSyncInterval} />
      <SettingRow icon="wifi-outline" label="Upload mode" value={uploadLabel} onPress={chooseUploadMode} />
      <SettingRow icon="image-outline" label="Image quality" value="High (1080p)" />
    </View>
    <Text style={styles.sectionTitle}>ACCOUNT & SECURITY</Text><View style={styles.section}>
      <SettingRow icon="person-outline" label="Display name" value={displayName} onPress={() => router.push('/profile')} />
      <SettingRow icon="key-outline" label="Update password" onPress={() => router.push('/profile')} />
      <SettingRow icon={isDark ? 'moon' : 'sunny-outline'} label="Dark mode" control={<Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: colors.borderStrong, true: colors.primary }} thumbColor={colors.paper} />} />
    </View>
    <Text style={styles.sectionTitle}>ABOUT</Text><View style={styles.section}><SettingRow icon="document-text-outline" label="Terms of service" onPress={() => router.push('/legal?document=terms')} /><SettingRow icon="shield-checkmark-outline" label="Privacy policy" onPress={() => router.push('/legal?document=privacy')} /><SettingRow icon="information-circle-outline" label="App version" value="1.0.0" /></View>
    <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn} activeOpacity={0.8}><Ionicons name="log-out-outline" size={18} color={colors.error} /><Text style={styles.signOutText}>Sign out session</Text></TouchableOpacity>
  </ScrollView></Animated.View>
    <SettingsChoiceModal
      visible={choiceModal !== null}
      eyebrow={choiceModal === 'sync' ? 'PHOTO RHYTHM' : 'SMART UPLOADS'}
      title={choiceModal === 'sync' ? 'Choose your reminder rhythm' : 'Choose your connection'}
      description={choiceModal === 'sync' ? 'FastSend will gently remind you to push new photos while a trip is active.' : 'FastSend uses this preference before it starts sending photos from your device.'}
      choices={choiceModal === 'sync' ? syncChoices : uploadChoices}
      selectedValue={choiceModal === 'sync' ? String(settings.sync_interval_hours) : settings.upload_mode}
      onSelect={selectChoice}
      onClose={() => setChoiceModal(null)}
      saving={saving}
    />
  </ScreenShell>;
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  inner: { flex: 1 }, scroll: { paddingBottom: 118 }, header: { marginBottom: 24 }, eyebrow: { color: colors.primaryDark, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8 }, title: { color: colors.textPrimary, fontSize: 34, fontWeight: '800', letterSpacing: -0.9 }, profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.sageDark, borderRadius: radius.xl, padding: 20, marginBottom: 32, gap: 16 }, avatar: { width: 62, height: 62, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-6deg' }] }, avatarText: { color: '#FFFDF8', fontSize: 20, fontWeight: '900', transform: [{ rotate: '6deg' }] }, profileInfo: { flex: 1 }, displayName: { color: '#FFFDF8', fontSize: 20, fontWeight: '800', marginBottom: 4 }, emailText: { color: 'rgba(255,253,248,0.65)', fontSize: 12, marginBottom: 9 }, memberPill: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', backgroundColor: colors.paper, paddingHorizontal: 8, paddingVertical: 5, borderRadius: radius.full }, memberText: { color: colors.primaryDark, fontSize: 8, fontWeight: '900', letterSpacing: 0.7 }, sectionTitle: { color: colors.textPrimary, fontSize: 10, fontWeight: '900', letterSpacing: 1.4, marginBottom: 10, marginTop: 5 }, section: { backgroundColor: colors.paper, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: 23 }, row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: colors.divider, gap: 11 }, rowDisabled: { opacity: 0.5 }, rowIcon: { width: 32, height: 32, borderRadius: 11, backgroundColor: colors.bgElevated, justifyContent: 'center', alignItems: 'center' }, rowIconDanger: { backgroundColor: colors.errorLight }, rowLabel: { flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: '700' }, rowLabelDisabled: { color: colors.textMuted }, rowValue: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' }, dangerText: { color: colors.error }, signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.errorLight, borderRadius: radius.md, paddingVertical: 16, borderWidth: 1, borderColor: colors.errorLight }, signOutText: { color: colors.error, fontSize: 13, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
});
