import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenShell } from '../../components/ScreenShell';
import { BrandMark } from '../../components/BrandMark';
import { UserAvatar } from '../../components/UserAvatar';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { useTheme } from '../../context/ThemeContext';

export default function HomeScreen() {
  const router = useRouter();
  const { activeTripId, user } = useAuth();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, bounciness: 4, speed: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <ScreenShell>
      <Animated.View style={[styles.inner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.header}><View><Text style={styles.kicker}>YOUR MEMORY STUDIO</Text><Text style={styles.title}>Good morning.</Text></View><TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/profile')} activeOpacity={0.8}><UserAvatar name={user?.displayName || user?.email} imageUrl={user?.photoURL} size={44} /></TouchableOpacity></View>

          {activeTripId ? (
            <View style={styles.activeCard}>
              <View style={styles.cardTop}><View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE NOW</Text></View><Text style={styles.cardMeta}>ID / {activeTripId.slice(-6).toUpperCase()}</Text></View>
              <View style={styles.activeArt}><View style={styles.photoShapeOne} /><View style={styles.photoShapeTwo} /><View style={styles.artIcon}><Ionicons name="camera-outline" size={28} color={colors.paper} /></View></View>
              <Text style={styles.activeTitle}>Your trip is in motion.</Text>
              <Text style={styles.activeSub}>Guests can join and receive their photos while the story is still unfolding.</Text>
              <PrimaryButton title="Manage live trip" onPress={() => router.push('/active-trip')} style={styles.cardButton} />
            </View>
          ) : (
            <>
              <View style={styles.heroCard}>
                <View style={styles.heroCopy}><Text style={styles.heroKicker}>THE SIMPLE WAY TO SHARE</Text><Text style={styles.heroTitle}>Make the moment last longer.</Text><Text style={styles.heroSub}>Create a trip and send every guest their own collection.</Text></View>
                <View style={styles.heroIcon}><Ionicons name="sparkles-outline" size={28} color={colors.paper} /></View>
                <PrimaryButton title="Create a new trip" onPress={() => router.push('/create-trip')} style={styles.heroButton} />
              </View>
              <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>THE FAST SEND METHOD</Text><Text style={styles.sectionNote}>03 STEPS</Text></View>
              <View style={styles.methodList}>
                {[
                  { icon: 'add-circle-outline' as const, title: 'Create a room', text: 'Name your moment and start a live session.' },
                  { icon: 'qr-code-outline' as const, title: 'Show one code', text: 'Guests scan once to enter the story.' },
                  { icon: 'sparkles-outline' as const, title: 'Let AI sort it', text: 'Every face finds the photos it belongs in.' },
                ].map((item, index) => <View key={item.title} style={styles.methodRow}><View style={styles.methodIcon}><Ionicons name={item.icon} size={20} color={colors.primaryDark} /></View><View style={styles.methodCopy}><Text style={styles.methodTitle}>{item.title}</Text><Text style={styles.methodText}>{item.text}</Text></View><Text style={styles.methodIndex}>0{index + 1}</Text></View>)}
              </View>
            </>
          )}
        </ScrollView>
      </Animated.View>
    </ScreenShell>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  inner: { flex: 1 },
  scroll: { paddingTop: 8, paddingBottom: 116 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  kicker: { fontSize: 10, fontWeight: '900', color: colors.primaryDark, letterSpacing: 1.5, marginBottom: 7 },
  title: { fontSize: 31, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.9 },
  profileBtn: { width: 44, height: 44, borderRadius: 16, backgroundColor: colors.sage, alignItems: 'center', justifyContent: 'center' },
  heroCard: { minHeight: 360, borderRadius: radius.xl, backgroundColor: colors.sageDark, padding: 24, overflow: 'hidden', marginBottom: 34 },
  heroCopy: { flex: 1 },
  heroKicker: { color: colors.primaryLight, fontSize: 10, fontWeight: '900', letterSpacing: 1.4, marginBottom: 18 },
  heroTitle: { color: colors.paper, fontSize: 31, lineHeight: 35, fontWeight: '800', letterSpacing: -0.8, maxWidth: 270 },
  heroSub: { color: 'rgba(255,253,248,0.72)', fontSize: 14, lineHeight: 21, marginTop: 14, maxWidth: 250 },
  heroIcon: { position: 'absolute', right: 25, top: 92, width: 68, height: 68, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '10deg' }] },
  heroButton: { marginBottom: 0, marginTop: 22 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 11, fontWeight: '900', color: colors.textPrimary, letterSpacing: 1.4 },
  sectionNote: { color: colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  methodList: { backgroundColor: colors.paper, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 17 },
  methodRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 17, borderBottomWidth: 1, borderBottomColor: colors.divider },
  methodIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  methodCopy: { flex: 1 },
  methodTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '800', marginBottom: 3 },
  methodText: { color: colors.textSecondary, fontSize: 12, lineHeight: 17 },
  methodIndex: { color: colors.textMuted, fontSize: 11, fontWeight: '800', marginLeft: 8 },
  activeCard: { backgroundColor: colors.paper, borderRadius: radius.xl, padding: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 24 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  livePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 7, borderRadius: radius.full, backgroundColor: colors.successLight, gap: 7 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success },
  liveText: { color: colors.success, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  cardMeta: { color: colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  activeArt: { height: 138, borderRadius: 20, backgroundColor: colors.sage, overflow: 'hidden', marginBottom: 20, alignItems: 'center', justifyContent: 'center' },
  photoShapeOne: { position: 'absolute', width: 180, height: 220, borderRadius: 28, backgroundColor: colors.sageDark, transform: [{ rotate: '-19deg' }, { translateX: -55 }, { translateY: 12 }] },
  photoShapeTwo: { position: 'absolute', width: 150, height: 190, borderRadius: 26, backgroundColor: colors.primary, transform: [{ rotate: '17deg' }, { translateX: 78 }, { translateY: -16 }] },
  artIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: 'rgba(31,41,38,0.9)', alignItems: 'center', justifyContent: 'center' },
  activeTitle: { color: colors.textPrimary, fontSize: 24, fontWeight: '800', letterSpacing: -0.4, marginBottom: 8 },
  activeSub: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 20 },
  cardButton: { marginBottom: 0 },
});
