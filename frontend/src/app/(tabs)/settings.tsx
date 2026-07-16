import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { HalfHalfLayout } from '../../components/HalfHalfLayout';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

export default function SettingsScreen() {
  const router = useRouter();

  const yellowContent = (
    <View style={styles.yellowContent}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>A</Text>
      </View>
      <Text style={styles.name}>Ahmed Organizer</Text>
      <Text style={styles.email}>ahmed@example.com</Text>
    </View>
  );

  const SettingRow = ({ label, value, onPress, danger }: any) => (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <Text style={[styles.rowLabel, danger && styles.dangerText]}>{label}</Text>
      {value && <Text style={styles.rowValue}>{value}</Text>}
    </TouchableOpacity>
  );

  const whiteContent = (
    <ScrollView style={styles.whiteContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Upload Settings</Text>
      <View style={styles.section}>
        <SettingRow label="Reminder Interval" value="Every 2 hours" />
        <SettingRow label="Upload on Wi-Fi only" value="ON" />
      </View>

      <Text style={styles.sectionTitle}>Account</Text>
      <View style={styles.section}>
        <SettingRow label="Display Name" value="Ahmed" />
        <SettingRow label="Change Password" />
      </View>

      <Text style={styles.sectionTitle}>Danger Zone</Text>
      <View style={styles.section}>
        <SettingRow 
          label="Sign Out" 
          danger 
          onPress={() => router.replace('/login')} 
        />
      </View>
    </ScrollView>
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
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: typography.size.xl,
    fontWeight: 'bold',
    color: colors.yellow,
  },
  name: {
    fontSize: typography.size.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  email: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  whiteContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: typography.size.sm,
    fontWeight: 'bold',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.divider,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rowLabel: {
    fontSize: typography.size.base,
    color: colors.textPrimary,
  },
  rowValue: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
  },
  dangerText: {
    color: colors.error,
    fontWeight: 'bold',
  }
});
