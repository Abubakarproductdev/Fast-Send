import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ChevronRight,
  Clock3,
  Wifi,
  Image as ImageIcon,
  UserRound,
  KeyRound,
  ShieldCheck,
  FileText,
  LogOut,
  BadgeCheck,
} from 'lucide-react-native';
import {
  signOut,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { useTripModal } from '../../context/TripModalContext';
import { api, UploadMode } from '../../services/api';
import { storage } from '../../utils/storage';
import { getErrorMessage } from '../../utils/errors';
import { StatusBar } from '../../components/StatusBar';
import { NeoSheet } from '../../components/ui/NeoSheet';
import { NeoField } from '../../components/ui/NeoField';
import { NeoInput } from '../../components/ui/NeoInput';
import { NeoButton } from '../../components/ui/NeoButton';
import { colors, neoShadow } from '../../theme/colors';

const SYNC_OPTIONS = ['1 hour', '6 hours', '12 hours', '24 hours'];
const MODE_OPTIONS = ['Wi-Fi only', 'Wi-Fi + cellular'];
const QUALITY_OPTIONS = ['High (1080p)', 'Medium (720p)', 'Original (4K)'];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, organizerId, refreshUser } = useAuth();
  const { showToast } = useTripModal();

  const [sync, setSync] = useState('6 hours');
  const [uploadMode, setUploadMode] = useState('Wi-Fi + cellular');
  const [quality, setQuality] = useState('High (1080p)');

  const [activeSheet, setActiveSheet] = useState<
    null | 'sync' | 'mode' | 'quality' | 'name' | 'password' | 'signout'
  >(null);

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Organizer';
  const email = user?.email || 'No email available';

  const [nameDraft, setNameDraft] = useState(displayName);
  const [nameBusy, setNameBusy] = useState(false);
  const [nameError, setNameError] = useState('');

  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNext, setPwNext] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    storage.getImageQuality().then(setQuality);
    storage.getUploadMode().then((m) => {
      setUploadMode(m === 'wifi_only' ? 'Wi-Fi only' : 'Wi-Fi + cellular');
    });
    storage.getSyncIntervalHours().then((h) => {
      setSync(h === 1 ? '1 hour' : `${h} hours`);
    });
  }, []);

  const getInitials = (name: string) => {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || 'FS';
  };

  const handlePickSync = async (opt: string) => {
    setSync(opt);
    const hours = parseInt(opt, 10) || 6;
    await storage.setSyncIntervalHours(hours);
    if (organizerId) {
      api.updateOrganizerSettings(organizerId, { sync_interval_hours: hours }).catch(() => {});
    }
    setActiveSheet(null);
    showToast(`Sync interval updated to ${opt}`);
  };

  const handlePickMode = async (opt: string) => {
    setUploadMode(opt);
    const mode: UploadMode = opt === 'Wi-Fi only' ? 'wifi_only' : 'wifi_and_cellular';
    await storage.setUploadMode(mode);
    if (organizerId) {
      api.updateOrganizerSettings(organizerId, { upload_mode: mode }).catch(() => {});
    }
    setActiveSheet(null);
    showToast(`Upload mode set to ${opt}`);
  };

  const handlePickQuality = async (opt: string) => {
    setQuality(opt);
    await storage.setImageQuality(opt);
    setActiveSheet(null);
    showToast(`Image quality set to ${opt}`);
  };

  const handleSaveName = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      setNameError('Name cannot be empty.');
      return;
    }
    setNameBusy(true);
    setNameError('');
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: trimmed });
      }
      if (organizerId) {
        await api.updateOrganizerProfile(organizerId, trimmed);
      }
      await refreshUser();
      setActiveSheet(null);
      showToast('Name updated');
    } catch (err) {
      setNameError(getErrorMessage(err));
    } finally {
      setNameBusy(false);
    }
  };

  const handleSavePassword = async () => {
    if (!pwCurrent || !pwNext) {
      setPwError('Please fill out all fields.');
      return;
    }
    if (pwNext.length < 6) {
      setPwError('New password must be at least 6 characters.');
      return;
    }
    if (pwNext !== pwConfirm) {
      setPwError('New passwords do not match.');
      return;
    }

    setPwBusy(true);
    setPwError('');
    try {
      if (!auth.currentUser || !auth.currentUser.email) {
        throw new Error('No active user session found.');
      }
      const cred = EmailAuthProvider.credential(auth.currentUser.email, pwCurrent);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, pwNext);
      setActiveSheet(null);
      setPwCurrent('');
      setPwNext('');
      setPwConfirm('');
      showToast('Password updated');
    } catch (err) {
      setPwError(getErrorMessage(err));
    } finally {
      setPwBusy(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace('/onboarding');
    } catch {}
  };

  return (
    <View style={styles.container}>
      <StatusBar />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>ORGANIZER</Text>
          <Text style={styles.title}>Profile & Settings</Text>
        </View>

        {/* User Card */}
        <View style={styles.sectionWrap}>
          <View style={[styles.userCard, neoShadow]}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
            </View>
            <View style={styles.userCopy}>
              <Text style={styles.userName} numberOfLines={1}>{displayName}</Text>
              <Text style={styles.userEmail} numberOfLines={1}>{email}</Text>
            </View>
          </View>
        </View>

        {/* Photo Sync Group */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeader}>PHOTO SYNC</Text>
          <View style={[styles.groupCard, neoShadow]}>
            <TouchableOpacity
              onPress={() => setActiveSheet('sync')}
              style={styles.rowItem}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <View style={styles.rowIconBox}>
                  <Clock3 size={14} strokeWidth={2.6} color={colors.ink} />
                </View>
                <Text style={styles.rowTitle}>Sync interval</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.rowValue}>{sync}</Text>
                <ChevronRight size={14} color={colors.mut} />
              </View>
            </TouchableOpacity>

            <View style={styles.rowDivider} />

            <TouchableOpacity
              onPress={() => setActiveSheet('mode')}
              style={styles.rowItem}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <View style={styles.rowIconBox}>
                  <Wifi size={14} strokeWidth={2.6} color={colors.ink} />
                </View>
                <Text style={styles.rowTitle}>Upload mode</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.rowValue}>{uploadMode}</Text>
                <ChevronRight size={14} color={colors.mut} />
              </View>
            </TouchableOpacity>

            <View style={styles.rowDivider} />

            <TouchableOpacity
              onPress={() => setActiveSheet('quality')}
              style={styles.rowItem}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <View style={styles.rowIconBox}>
                  <ImageIcon size={14} strokeWidth={2.6} color={colors.ink} />
                </View>
                <Text style={styles.rowTitle}>Image quality</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.rowValue}>{quality}</Text>
                <ChevronRight size={14} color={colors.mut} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Group */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeader}>ACCOUNT</Text>
          <View style={[styles.groupCard, neoShadow]}>
            <TouchableOpacity
              onPress={() => {
                setNameDraft(displayName);
                setNameError('');
                setActiveSheet('name');
              }}
              style={styles.rowItem}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <View style={styles.rowIconBox}>
                  <UserRound size={14} strokeWidth={2.6} color={colors.ink} />
                </View>
                <Text style={styles.rowTitle}>Display name</Text>
              </View>
              <ChevronRight size={14} color={colors.mut} />
            </TouchableOpacity>

            <View style={styles.rowDivider} />

            <TouchableOpacity
              onPress={() => {
                setPwCurrent('');
                setPwNext('');
                setPwConfirm('');
                setPwError('');
                setActiveSheet('password');
              }}
              style={styles.rowItem}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <View style={styles.rowIconBox}>
                  <KeyRound size={14} strokeWidth={2.6} color={colors.ink} />
                </View>
                <Text style={styles.rowTitle}>Change password</Text>
              </View>
              <ChevronRight size={14} color={colors.mut} />
            </TouchableOpacity>

            <View style={styles.rowDivider} />

            <TouchableOpacity
              onPress={() => router.push('/legal?doc=privacy')}
              style={styles.rowItem}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <View style={styles.rowIconBox}>
                  <ShieldCheck size={14} strokeWidth={2.6} color={colors.ink} />
                </View>
                <Text style={styles.rowTitle}>Privacy Policy</Text>
              </View>
              <ChevronRight size={14} color={colors.mut} />
            </TouchableOpacity>

            <View style={styles.rowDivider} />

            <TouchableOpacity
              onPress={() => router.push('/legal?doc=terms')}
              style={styles.rowItem}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <View style={styles.rowIconBox}>
                  <FileText size={14} strokeWidth={2.6} color={colors.ink} />
                </View>
                <Text style={styles.rowTitle}>Terms of Service</Text>
              </View>
              <ChevronRight size={14} color={colors.mut} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out Group */}
        <View style={[styles.sectionWrap, { marginTop: 4 }]}>
          <View style={[styles.groupCard, neoShadow]}>
            <TouchableOpacity
              onPress={() => setActiveSheet('signout')}
              style={styles.rowItem}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.rowIconBox, { backgroundColor: colors.flameSoft }]}>
                  <LogOut size={14} strokeWidth={2.6} color={colors.flame} />
                </View>
                <Text style={[styles.rowTitle, { color: colors.flame }]}>Sign out</Text>
              </View>
              <ChevronRight size={14} color={colors.flame} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Sync Interval Sheet */}
      <NeoSheet
        open={activeSheet === 'sync'}
        onClose={() => setActiveSheet(null)}
        title="Sync interval"
        subtitle="How often Fast Send should remind you to push photos."
      >
        <View style={styles.optionsWrap}>
          {SYNC_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt}
              onPress={() => handlePickSync(opt)}
              style={[
                styles.optionItem,
                sync === opt && styles.optionItemActive,
              ]}
              activeOpacity={0.8}
            >
              <Text style={styles.optionText}>{opt}</Text>
              {sync === opt ? <BadgeCheck size={16} color={colors.ink} strokeWidth={2.8} /> : null}
            </TouchableOpacity>
          ))}
        </View>
      </NeoSheet>

      {/* Upload Mode Sheet */}
      <NeoSheet
        open={activeSheet === 'mode'}
        onClose={() => setActiveSheet(null)}
        title="Upload mode"
        subtitle="Choose whether photos can be pushed over cellular data."
      >
        <View style={styles.optionsWrap}>
          {MODE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt}
              onPress={() => handlePickMode(opt)}
              style={[
                styles.optionItem,
                uploadMode === opt && styles.optionItemActive,
              ]}
              activeOpacity={0.8}
            >
              <Text style={styles.optionText}>{opt}</Text>
              {uploadMode === opt ? <BadgeCheck size={16} color={colors.ink} strokeWidth={2.8} /> : null}
            </TouchableOpacity>
          ))}
        </View>
      </NeoSheet>

      {/* Image Quality Sheet */}
      <NeoSheet
        open={activeSheet === 'quality'}
        onClose={() => setActiveSheet(null)}
        title="Image quality"
        subtitle="Resolution for photos pushed to the guest gallery."
      >
        <View style={styles.optionsWrap}>
          {QUALITY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt}
              onPress={() => handlePickQuality(opt)}
              style={[
                styles.optionItem,
                quality === opt && styles.optionItemActive,
              ]}
              activeOpacity={0.8}
            >
              <Text style={styles.optionText}>{opt}</Text>
              {quality === opt ? <BadgeCheck size={16} color={colors.ink} strokeWidth={2.8} /> : null}
            </TouchableOpacity>
          ))}
        </View>
      </NeoSheet>

      {/* Name Sheet */}
      <NeoSheet
        open={activeSheet === 'name'}
        onClose={() => setActiveSheet(null)}
        title="Display name"
        subtitle="Your name shown across your trips and invites."
      >
        <NeoField label="Your name">
          <NeoInput
            value={nameDraft}
            onChangeText={(t) => {
              setNameDraft(t);
              setNameError('');
            }}
            placeholder="e.g. Alex Smith"
            autoFocus
          />
        </NeoField>
        {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
        <View style={styles.sheetBtnWrap}>
          <NeoButton
            title={nameBusy ? 'Saving…' : 'Save name'}
            onPress={handleSaveName}
            loading={nameBusy}
            size="lg"
          />
        </View>
      </NeoSheet>

      {/* Password Sheet */}
      <NeoSheet
        open={activeSheet === 'password'}
        onClose={() => setActiveSheet(null)}
        title="Change password"
        subtitle="Enter your current password and pick a new one."
      >
        <NeoField label="Current password">
          <NeoInput
            value={pwCurrent}
            onChangeText={setPwCurrent}
            placeholder="••••••••"
            secureTextEntry
          />
        </NeoField>
        <NeoField label="New password (at least 6 characters)">
          <NeoInput
            value={pwNext}
            onChangeText={setPwNext}
            placeholder="••••••••"
            secureTextEntry
          />
        </NeoField>
        <NeoField label="Confirm new password">
          <NeoInput
            value={pwConfirm}
            onChangeText={setPwConfirm}
            placeholder="••••••••"
            secureTextEntry
          />
        </NeoField>
        {pwError ? <Text style={styles.errorText}>{pwError}</Text> : null}
        <View style={styles.sheetBtnWrap}>
          <NeoButton
            title={pwBusy ? 'Updating…' : 'Update password'}
            onPress={handleSavePassword}
            loading={pwBusy}
            size="lg"
          />
        </View>
      </NeoSheet>

      {/* Sign Out Sheet */}
      <NeoSheet
        open={activeSheet === 'signout'}
        onClose={() => setActiveSheet(null)}
        title="Sign out of Fast Send"
        subtitle="You can sign back in anytime. Your trips and photos stay safe."
      >
        <View style={styles.sheetBtnWrap}>
          <NeoButton
            title="Sign out"
            variant="danger"
            onPress={handleSignOut}
            size="lg"
          />
        </View>
      </NeoSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scroll: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    marginBottom: 12,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: colors.flame,
    marginBottom: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.ink,
  },
  sectionWrap: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    color: colors.mut,
    marginBottom: 8,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    padding: 16,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.brand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.ink,
  },
  userCopy: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.ink,
  },
  userEmail: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mut,
    marginTop: 2,
  },
  groupCard: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.creamDeep,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.ink,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowValue: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.mut,
  },
  rowDivider: {
    height: 2,
    backgroundColor: colors.cream,
  },
  optionsWrap: {
    gap: 10,
    paddingTop: 8,
    paddingBottom: 12,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionItemActive: {
    backgroundColor: colors.brand,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.ink,
  },
  sheetBtnWrap: {
    marginTop: 10,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.flame,
    marginBottom: 10,
  },
});
