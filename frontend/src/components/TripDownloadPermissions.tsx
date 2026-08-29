import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { radius } from '../theme/spacing';
import { DownloadPermission, TripSettings, TripSettingsPatch } from '../services/api';

export const DEFAULT_TRIP_SETTINGS: TripSettings = { download_permission: 'mine' };

const options: Array<{ value: DownloadPermission; title: string; description: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = [
  { value: 'mine', title: 'Download my photos', description: 'Guests see and download only solo photos where they appear.', icon: 'person-outline' },
  { value: 'mine_plus_group', title: 'Download my photos plus group photos', description: 'Guests see and download their photos and group moments they are in.', icon: 'people-outline' },
  { value: 'all', title: 'Download all photos', description: 'Guests see and download the complete trip collection.', icon: 'images-outline' },
];

export function TripDownloadPermissions({ settings, onChange, disabled = false }: { settings: TripSettings; onChange: (patch: TripSettingsPatch) => void; disabled?: boolean }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return <View>
    <Text style={styles.intro}>This one permission controls both what guests see and what they can download.</Text>
    <View style={styles.optionList}>
      {options.map((option) => <TouchableOpacity key={option.value} style={[styles.option, settings.download_permission === option.value && styles.optionSelected, disabled && styles.disabled]} onPress={() => onChange({ download_permission: option.value })} disabled={disabled} activeOpacity={0.8}>
                <View style={[styles.icon, settings.download_permission === option.value && styles.iconSelected]}><Ionicons name={option.icon} size={18} color={settings.download_permission === option.value ? '#FFFDF8' : colors.textSecondary} /></View>
        <View style={styles.copy}><Text style={styles.title}>{option.title}</Text><Text style={styles.description}>{option.description}</Text></View>
        <View style={[styles.radio, settings.download_permission === option.value && styles.radioSelected]}>{settings.download_permission === option.value && <View style={styles.dot} />}</View>
      </TouchableOpacity>)}
    </View>
    <View style={styles.note}><Ionicons name="shield-checkmark-outline" size={15} color={colors.primaryDark} /><Text style={styles.noteText}>Guest filters and direct photo IDs cannot expand this permission.</Text></View>
  </View>;
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  intro: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: 16 },
  optionList: { gap: 8 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.primaryGlow },
  icon: { width: 35, height: 35, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgElevated },
  iconSelected: { backgroundColor: colors.primary },
  copy: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 13, fontWeight: '800', marginBottom: 2 },
  description: { color: colors.textSecondary, fontSize: 11, lineHeight: 16 },
  radio: { width: 19, height: 19, borderRadius: 10, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: colors.primary },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary },
  note: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.sage, borderRadius: radius.md, padding: 11, marginTop: 13 },
  noteText: { flex: 1, color: colors.sageDark, fontSize: 11, lineHeight: 16, fontWeight: '600' },
  disabled: { opacity: 0.55 },
});
