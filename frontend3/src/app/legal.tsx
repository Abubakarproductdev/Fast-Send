import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, ShieldCheck, FileText, Info } from 'lucide-react-native';
import { StatusBar } from '../components/StatusBar';
import { useTheme } from '../theme/ThemeContext';

type LegalDocument = 'privacy' | 'terms';

const PRIVACY_SECTIONS: [string, string][] = [
  [
    'What FastSend handles',
    'FastSend handles account information, trip details, the photos an organizer chooses to send, and—when a guest chooses to join—a clear selfie used to locate that guest\'s eligible trip photos.',
  ],
  [
    'Why we use it',
    'We use this information to create trips, generate QR access, deliver the photos allowed by the organizer\'s trip setting, keep the service secure, and support your account.',
  ],
  [
    'Photo matching and sharing',
    'A guest joins with a selfie only for the trip they choose. The organizer\'s photo-permission setting controls what a guest can see and download. Guests cannot use a filter or direct link to expand that permission.',
  ],
  [
    'Storage and deletion',
    'Trip media and its related records remain available until the organizer deletes that trip. Deleting a trip is designed to remove its trip records and associated stored photos.',
  ],
  [
    'Your choices',
    'You can update your display name, change your password, control trip sharing settings, and ask the organization operating this FastSend deployment about access, correction, or deletion requests.',
  ],
];

const TERMS_SECTIONS: [string, string][] = [
  [
    'Using FastSend responsibly',
    'Only create trips and share QR codes when you have the right to share the photos and invite the people involved. Do not use FastSend to upload unlawful, harmful, or infringing content.',
  ],
  [
    'Guest consent',
    'Before using a guest\'s selfie or making photos available to them, make sure the guest has chosen to participate and understands the trip\'s photo-sharing purpose.',
  ],
  [
    'Privacy settings matter',
    'The organizer selects the trip\'s download permission. Respect that setting: it defines the maximum set of photos a guest may view or download.',
  ],
  [
    'Account security',
    'Keep your sign-in details private, use a strong password, and sign out of devices you do not control. You are responsible for activity performed through your account.',
  ],
  [
    'Service changes',
    'FastSend may improve or update features to keep the service reliable and secure. Important changes to how personal information is handled should be reflected in this notice.',
  ],
];

export default function LegalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ doc?: string }>();
  const initialDoc: LegalDocument = params.doc === 'terms' ? 'terms' : 'privacy';

  const [doc, setDoc] = useState<LegalDocument>(initialDoc);
  const { colors, neoShadow } = useTheme();

  const isPrivacy = doc === 'privacy';
  const sections = isPrivacy ? PRIVACY_SECTIONS : TERMS_SECTIONS;

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.cream },
    scrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backCircleBtn: {
      width: 42, height: 42, borderRadius: 21, borderWidth: 2,
      borderColor: colors.ink, backgroundColor: colors.white,
      justifyContent: 'center', alignItems: 'center',
    },
    topTitle: {
      fontSize: 17, fontFamily: 'Nunito_900Black', color: colors.ink,
    },
    topSpacer: { width: 42, height: 42 },
    heroCard: {
      backgroundColor: colors.leaf, borderRadius: 24, borderWidth: 1.5,
      borderTopWidth: 4,
      borderColor: colors.ink, padding: 22, marginTop: 16, marginBottom: 18,
    },
    iconCircle: {
      width: 50, height: 50, borderRadius: 16, borderWidth: 2, borderColor: colors.ink,
      backgroundColor: colors.brand, justifyContent: 'center', alignItems: 'center', marginBottom: 18,
    },
    heroEyebrow: {
      fontSize: 11, fontFamily: 'Nunito_900Black',
      letterSpacing: 1.8, color: 'rgba(248, 244, 233, 0.85)', marginBottom: 7,
    },
    heroTitle: {
      fontSize: 26, fontFamily: 'Nunito_900Black',
      lineHeight: 32, color: colors.cream, marginBottom: 7,
    },
    heroSubtitle: {
      fontSize: 14, fontFamily: 'Nunito_600SemiBold',
      lineHeight: 20, color: 'rgba(248, 244, 233, 0.85)',
    },
    switcherWrap: {
      flexDirection: 'row', borderRadius: 999, borderWidth: 2,
      borderColor: colors.ink, backgroundColor: colors.creamDeep,
      padding: 4, marginBottom: 18,
    },
    tabBtn: { flex: 1, paddingVertical: 11, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
    tabActive: { borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.brand },
    tabInactive: { borderWidth: 2, borderColor: 'transparent', backgroundColor: 'transparent' },
    tabText: { fontSize: 15, fontFamily: 'Nunito_900Black' },
    tabTextActive: { color: colors.ink },
    tabTextInactive: { color: colors.mut },
    lastUpdated: {
      fontSize: 11, fontFamily: 'Nunito_900Black',
      letterSpacing: 1.8, color: colors.mut, marginBottom: 12, paddingHorizontal: 4,
    },
    sectionsContainer: { gap: 11, marginBottom: 16 },
    sectionCard: {
      backgroundColor: colors.white, borderRadius: 20, borderWidth: 1.5,
      borderTopWidth: 4, borderColor: colors.ink, padding: 18,
    },
    sectionTitle: {
      fontSize: 16, fontFamily: 'Nunito_900Black',
      color: colors.ink, marginBottom: 7,
    },
    sectionBody: {
      fontSize: 13, fontFamily: 'Nunito_600SemiBold',
      lineHeight: 19, color: colors.textSecondary,
    },
    noticeCard: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 11,
      borderRadius: 20, borderWidth: 1.5,
      borderTopWidth: 4, borderColor: colors.ink,
      backgroundColor: 'rgba(246, 197, 0, 0.25)', padding: 18, marginBottom: 16,
    },
    noticeIcon: { marginTop: 1, flexShrink: 0 },
    noticeText: {
      flex: 1, fontSize: 12, fontFamily: 'Nunito_700Bold',
      lineHeight: 18, color: colors.textSecondary,
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backCircleBtn, neoShadow]}
            activeOpacity={0.8}
            accessibilityLabel="Back"
          >
            <ChevronLeft size={21} strokeWidth={3} color={colors.ink} />
          </TouchableOpacity>

          <Text style={styles.topTitle}>Legal</Text>
          <View style={styles.topSpacer} />
        </View>

        {/* Hero Card */}
        <View style={[styles.heroCard, neoShadow]}>
          <View style={styles.iconCircle}>
            {isPrivacy ? (
              <ShieldCheck size={24} strokeWidth={2.6} color={colors.ink} />
            ) : (
              <FileText size={24} strokeWidth={2.6} color={colors.ink} />
            )}
          </View>

          <Text style={styles.heroEyebrow}>FASTSEND COMMITMENT</Text>
          <Text style={styles.heroTitle}>
            {isPrivacy ? 'Privacy, clearly explained.' : 'Terms for sharing with care.'}
          </Text>
          <Text style={styles.heroSubtitle}>
            {isPrivacy
              ? 'A short guide to how photo-sharing information is used in this app.'
              : 'Simple expectations for organizers who create and share trips.'}
          </Text>
        </View>

        {/* Tab switcher */}
        <View style={styles.switcherWrap}>
          <TouchableOpacity
            onPress={() => setDoc('privacy')}
            style={[styles.tabBtn, isPrivacy ? [styles.tabActive, neoShadow] : styles.tabInactive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, isPrivacy ? styles.tabTextActive : styles.tabTextInactive]}>
              Privacy
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setDoc('terms')}
            style={[styles.tabBtn, !isPrivacy ? [styles.tabActive, neoShadow] : styles.tabInactive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, !isPrivacy ? styles.tabTextActive : styles.tabTextInactive]}>
              Terms
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.lastUpdated}>LAST UPDATED · AUGUST 2026</Text>

        {/* Sections list */}
        <View style={styles.sectionsContainer}>
          {sections.map(([title, body], i) => (
            <View key={i} style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>{title}</Text>
              <Text style={styles.sectionBody}>{body}</Text>
            </View>
          ))}
        </View>

        {/* Notice Card */}
        <View style={styles.noticeCard}>
          <Info size={19} strokeWidth={2.6} color={colors.ink} style={styles.noticeIcon} />
          <Text style={styles.noticeText}>
            This in-app summary should be reviewed by the organization operating your FastSend
            deployment before public launch, especially for local privacy, biometric-data, and
            consumer-law requirements.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
