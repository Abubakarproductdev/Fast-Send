import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenShell } from '../components/ScreenShell';
import { useTheme } from '../context/ThemeContext';
import { radius } from '../theme/spacing';

type LegalDocument = 'privacy' | 'terms';

const PRIVACY_SECTIONS = [
  ['What FastSend handles', 'FastSend handles account information, trip details, the photos an organizer chooses to send, and—when a guest chooses to join—a clear selfie used to locate that guest’s eligible trip photos.'],
  ['Why we use it', 'We use this information to create trips, generate QR access, deliver the photos allowed by the organizer’s trip setting, keep the service secure, and support your account.'],
  ['Photo matching and sharing', 'A guest joins with a selfie only for the trip they choose. The organizer’s photo-permission setting controls what a guest can see and download. Guests cannot use a filter or direct link to expand that permission.'],
  ['Storage and deletion', 'Trip media and its related records remain available until the organizer deletes that trip. Deleting a trip is designed to remove its trip records and associated stored photos.'],
  ['Your choices', 'You can update your display name, change your password, control trip sharing settings, and ask the organization operating this FastSend deployment about access, correction, or deletion requests.'],
];

const TERMS_SECTIONS = [
  ['Using FastSend responsibly', 'Only create trips and share QR codes when you have the right to share the photos and invite the people involved. Do not use FastSend to upload unlawful, harmful, or infringing content.'],
  ['Guest consent', 'Before using a guest’s selfie or making photos available to them, make sure the guest has chosen to participate and understands the trip’s photo-sharing purpose.'],
  ['Privacy settings matter', 'The organizer selects the trip’s download permission. Respect that setting: it defines the maximum set of photos a guest may view or download.'],
  ['Account security', 'Keep your sign-in details private, use a strong password, and sign out of devices you do not control. You are responsible for activity performed through your account.'],
  ['Service changes', 'FastSend may improve or update features to keep the service reliable and secure. Important changes to how personal information is handled should be reflected in this notice.'],
];

export default function LegalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ document?: string }>();
  const initialDocument: LegalDocument = params.document === 'terms' ? 'terms' : 'privacy';
  const [document, setDocument] = useState<LegalDocument>(initialDocument);
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isPrivacy = document === 'privacy';
  const sections = isPrivacy ? PRIVACY_SECTIONS : TERMS_SECTIONS;

  return <ScreenShell><ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
    <View style={styles.topBar}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Go back"><Ionicons name="arrow-back" size={20} color={colors.textPrimary} /></TouchableOpacity>
      <Text style={styles.topBarTitle}>Legal</Text><View style={styles.topBarSpacer} />
    </View>
    <View style={styles.hero}>
      <View style={styles.heroIcon}><Ionicons name={isPrivacy ? 'shield-checkmark-outline' : 'document-text-outline'} size={25} color="#FFFDF8" /></View>
      <Text style={styles.eyebrow}>FASTSEND COMMITMENT</Text>
      <Text style={styles.heroTitle}>{isPrivacy ? 'Privacy, clearly explained.' : 'Terms for sharing with care.'}</Text>
      <Text style={styles.heroText}>{isPrivacy ? 'A short guide to how photo-sharing information is used in this app.' : 'Simple expectations for organizers who create and share trips.'}</Text>
    </View>
    <View style={styles.switcher}>
      <TouchableOpacity onPress={() => setDocument('privacy')} style={[styles.switchButton, document === 'privacy' && styles.switchButtonActive]}><Text style={[styles.switchText, document === 'privacy' && styles.switchTextActive]}>Privacy</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => setDocument('terms')} style={[styles.switchButton, document === 'terms' && styles.switchButtonActive]}><Text style={[styles.switchText, document === 'terms' && styles.switchTextActive]}>Terms</Text></TouchableOpacity>
    </View>
    <Text style={styles.updated}>LAST UPDATED · AUGUST 2026</Text>
    {sections.map(([title, body]) => <View key={title} style={styles.section}><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.sectionBody}>{body}</Text></View>)}
    <View style={styles.notice}><Ionicons name="information-circle-outline" size={18} color={colors.primaryDark} /><Text style={styles.noticeText}>This in-app summary should be reviewed by the organization operating your FastSend deployment before public launch, especially for local privacy, biometric-data, and consumer-law requirements.</Text></View>
  </ScrollView></ScreenShell>;
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  scroll: { paddingTop: 8, paddingBottom: 44 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backButton: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.border },
  topBarTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '800' },
  topBarSpacer: { width: 42 },
  hero: { borderRadius: radius.xl, backgroundColor: colors.sageDark, padding: 22, marginBottom: 18 },
  heroIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, marginBottom: 17 },
  eyebrow: { color: colors.primaryLight, fontSize: 9, fontWeight: '900', letterSpacing: 1.35, marginBottom: 8 },
  heroTitle: { color: '#FFFDF8', fontSize: 25, fontWeight: '800', letterSpacing: -0.45, marginBottom: 8 },
  heroText: { color: 'rgba(255,253,248,0.76)', fontSize: 13, lineHeight: 20 },
  switcher: { flexDirection: 'row', backgroundColor: colors.bgElevated, borderRadius: radius.md, padding: 4, marginBottom: 18 },
  switchButton: { flex: 1, minHeight: 39, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  switchButtonActive: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.border },
  switchText: { color: colors.textSecondary, fontSize: 12, fontWeight: '800' },
  switchTextActive: { color: colors.primaryDark },
  updated: { color: colors.textMuted, fontSize: 9, fontWeight: '900', letterSpacing: 1.2, marginBottom: 10, paddingLeft: 3 },
  section: { backgroundColor: colors.paper, borderRadius: radius.lg, padding: 17, borderWidth: 1, borderColor: colors.border, marginBottom: 10 },
  sectionTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '800', marginBottom: 7 },
  sectionBody: { color: colors.textSecondary, fontSize: 12, lineHeight: 19 },
  notice: { flexDirection: 'row', gap: 10, backgroundColor: colors.warningLight, borderRadius: radius.md, padding: 14, marginTop: 10 },
  noticeText: { flex: 1, color: colors.textSecondary, fontSize: 11, lineHeight: 17 },
});
