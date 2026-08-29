import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenShell } from '../../components/ScreenShell';
import { UserAvatar } from '../../components/UserAvatar';
import { radius } from '../../theme/spacing';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const STEPS = [
  { num: '1', icon: 'add-circle-outline' as const, title: 'Create a new trip', text: 'Give your trip a name and start collecting moments.', bg: '#E86F56', light: '#FCE5DD', dark: '#39231F', darkAccent: '#6B3A30' },
  { num: '2', icon: 'camera-outline' as const, title: 'Take your photos', text: 'Close the app and take all the photos you want, just as you normally do.', bg: '#315B51', light: '#DCE7DE', dark: '#1D332B', darkAccent: '#315B51' },
  { num: '3', icon: 'cloud-upload-outline' as const, title: 'Push photos when you like', text: 'Push them after the trip, all at once, or every few hours. Pushed photos become available to share through the trip.', bg: '#5D927B', light: 'rgba(93,146,123,0.14)', dark: '#1B3328', darkAccent: '#356B55' },
  { num: '4', icon: 'stop-circle-outline' as const, title: 'End the trip', text: 'When you do not want to share more photos, end the trip from the live-trip page.', bg: '#C58A3A', light: 'rgba(197,138,58,0.14)', dark: '#3B2D1B', darkAccent: '#694A23' },
  { num: '5', icon: 'refresh-circle-outline' as const, title: 'Relive it anytime', text: 'Want to restart? Open the trip from Archive and choose Relive to continue with the same trip.', bg: '#7B668F', light: 'rgba(123,102,143,0.14)', dark: '#30263A', darkAccent: '#624F73' },
  { num: '6', icon: 'options-outline' as const, title: 'Set photo permissions', text: 'Open Trip Settings to choose whether guests can download their photos, all photos, or their photos plus group photos.', bg: '#4B7893', light: 'rgba(75,120,147,0.14)', dark: '#1D303B', darkAccent: '#3E687F' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { activeTripId, user } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = makeStyles(colors, isDark);
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
      <View pointerEvents="none" style={styles.pageArtwork}>
        <ImageBackground source={require('../../../assets/images/home-photo-strip.jpg')} resizeMode="cover" style={styles.pageArtworkImage} imageStyle={styles.pageArtworkImageStyle} />
        <LinearGradient
          colors={isDark ? ['rgba(18,25,23,0.16)', 'rgba(18,25,23,0.76)', colors.bg] : ['rgba(244,241,235,0.06)', 'rgba(244,241,235,0.70)', colors.bg]}
          locations={[0, 0.64, 1]}
          style={styles.pageArtworkFade}
        />
      </View>
      <Animated.View style={[styles.inner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.brand}>FAST SEND</Text>
            <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/profile')} activeOpacity={0.8}>
              <UserAvatar name={user?.displayName || user?.email} imageUrl={user?.photoURL} size={44} />
            </TouchableOpacity>
          </View>

          {activeTripId ? (
            /* Active trip card */
            <View style={styles.activeCard}>
              <View style={styles.cardTop}>
                <View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE NOW</Text></View>
                <Text style={styles.cardMeta}>ID / {activeTripId.slice(-6).toUpperCase()}</Text>
              </View>
              <ImageBackground source={require('../../../assets/images/home-journey-hero.png')} resizeMode="cover" style={styles.activeArt} imageStyle={styles.activeArtImage}>
                <View style={styles.activeArtOverlay} />
                <View style={styles.photoShapeOne} /><View style={styles.photoShapeTwo} />
                <View style={styles.artIcon}><Ionicons name="sparkles-outline" size={28} color="#FFFDF8" /></View>
              </ImageBackground>
              <Text style={styles.activeTitle}>Your trip is live!</Text>
              <Text style={styles.activeSub}>Guests can scan your QR code to join. Tap below to upload your photos and manage the trip.</Text>
              <PrimaryButton title="Open my live trip" onPress={() => router.push('/active-trip')} style={styles.cardButton} />
            </View>
          ) : (
            <>
              {/* Hero */}
              <View style={styles.heroCard}>
                <ImageBackground source={require('../../../assets/images/home-journey-hero.png')} resizeMode="cover" style={styles.heroBackdrop} imageStyle={styles.heroImage}>
                  <View style={styles.heroOverlay} />
                  <View style={styles.heroGlow} />
                  <View style={styles.heroContent}>
                    <View style={styles.heroCopy}>
                      <Text style={styles.heroKicker}>SHARE PHOTOS WITH EVERYONE</Text>
                      <Text style={styles.heroTitle}>Create a trip{'\n'}before you go.</Text>
                      <Text style={styles.heroSub}>Start a trip, take photos, and every guest gets their photos — automatically.</Text>
                    </View>
                    <View style={styles.heroMoodPill}><View style={styles.heroMoodDot} /><Text style={styles.heroMoodText}>MOMENTS, MADE EASY</Text></View>
                    <View style={styles.heroIcon}><Ionicons name="sparkles-outline" size={28} color="#FFFDF8" /></View>
                    <PrimaryButton title="Create a new trip" onPress={() => router.push('/create-trip')} style={styles.heroButton} />
                  </View>
                </ImageBackground>
              </View>

              {/* How it works */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>HOW IT WORKS</Text>
                <Text style={styles.sectionNote}>6 SIMPLE STEPS</Text>
              </View>

              <View style={styles.journey}>
                {STEPS.map((step, index) => (
                  <React.Fragment key={step.num}>
                    <View style={[styles.stepCard, { backgroundColor: isDark ? step.dark : step.light, borderColor: step.bg + '40' }]}>
                      <View style={[styles.stepNumBadge, { backgroundColor: isDark ? step.darkAccent : step.bg }]}><Text style={styles.stepNumText}>{step.num}</Text></View>
                      <View style={[styles.stepIconBox, { backgroundColor: isDark ? step.darkAccent : step.bg }]}><Ionicons name={step.icon} size={24} color="#fff" /></View>
                      <View style={styles.stepCopy}>
                        <Text style={[styles.stepCardTitle, { color: step.bg }]}>{step.title}</Text>
                        <Text style={styles.stepCardText}>{step.text}</Text>
                      </View>
                    </View>
                    {index < STEPS.length - 1 && <View style={styles.connector}><View style={styles.connectorLine} /><Ionicons name="arrow-down" size={16} color={colors.textMuted} /></View>}
                  </React.Fragment>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </Animated.View>
    </ScreenShell>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors'], isDark: boolean) => StyleSheet.create({
  inner: { flex: 1 },
  scroll: { paddingTop: 9, paddingBottom: 116 },
  pageArtwork: { position: 'absolute', top: 0, left: 0, right: 0, height: '54%', overflow: 'hidden' },
  pageArtworkImage: { flex: 1 },
  pageArtworkImageStyle: { opacity: isDark ? 0.50 : 0.80 },
  pageArtworkFade: { ...StyleSheet.absoluteFillObject },
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 26 },
  brand: { fontFamily: 'Inter_800ExtraBold', fontSize: 17, color: colors.primaryDark, letterSpacing: 2.6 },
  profileBtn: { width: 44, height: 44, borderRadius: 16, backgroundColor: colors.sage, alignItems: 'center', justifyContent: 'center' },
  // Hero
  heroCard: { minHeight: 332, borderRadius: radius.xl, backgroundColor: colors.sageDark, overflow: 'hidden', marginBottom: 30, borderWidth: 1, borderColor: colors.border },
  heroBackdrop: { flex: 1, minHeight: 332 },
  heroImage: { opacity: isDark ? 0.15 : 0.55 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: isDark ? 'rgba(6, 12, 9, 0.88)' : 'rgba(19, 43, 36, 0.66)' },
  heroGlow: { position: 'absolute', width: 190, height: 190, borderRadius: 95, backgroundColor: isDark ? 'rgba(15, 24, 19, 0.72)' : 'rgba(232,111,86,0.24)', right: -52, bottom: -86 },
  heroContent: { flex: 1, padding: 24 },
  heroCopy: { flex: 1 },
  heroKicker: { fontFamily: 'Inter_700Bold', color: '#F7B6A6', fontSize: 10, letterSpacing: 1.6, marginBottom: 16 },
  heroTitle: { fontFamily: 'Inter_800ExtraBold', color: '#FFFDF8', fontSize: 28, lineHeight: 33, letterSpacing: -0.3, maxWidth: 260 },
  heroSub: { fontFamily: 'Inter_400Regular', color: 'rgba(255,253,248,0.72)', fontSize: 14, lineHeight: 21, marginTop: 12, maxWidth: 240 },
  heroMoodPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, marginBottom: 12, borderRadius: radius.full, backgroundColor: 'rgba(255,253,248,0.15)', borderWidth: 1, borderColor: 'rgba(255,253,248,0.20)' },
  heroMoodDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#F7B6A6' },
  heroMoodText: { color: '#FFFDF8', fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 1.05 },
  heroIcon: { position: 'absolute', right: 22, top: 82, width: 64, height: 64, borderRadius: 22, backgroundColor: isDark ? '#293B34' : colors.primary, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '10deg' }], borderWidth: 1, borderColor: isDark ? colors.borderStrong : 'rgba(255,253,248,0.36)' },
  heroButton: { marginBottom: 0, marginTop: 20 },
  // Section
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontFamily: 'Inter_800ExtraBold', fontSize: 11, color: colors.textPrimary, letterSpacing: 1.6 },
  sectionNote: { fontFamily: 'Inter_600SemiBold', color: colors.textMuted, fontSize: 10, letterSpacing: 1 },
  // Journey
  journey: { paddingBottom: 2 },
  stepCard: { borderRadius: 20, borderWidth: 1.5, padding: 16, minHeight: 106, flexDirection: 'row', alignItems: 'center' },
  stepNumBadge: { position: 'absolute', top: 12, right: 12, width: 22, height: 22, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontFamily: 'Inter_900Black', color: '#fff', fontSize: 10 },
  stepIconBox: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  stepCopy: { flex: 1, paddingRight: 22 },
  stepCardTitle: { fontFamily: 'Inter_700Bold', fontSize: 13, marginBottom: 5 },
  stepCardText: { fontFamily: 'Inter_400Regular', color: colors.textSecondary, fontSize: 12, lineHeight: 17 },
  connector: { height: 26, alignItems: 'center', justifyContent: 'center' },
  connectorLine: { position: 'absolute', height: 11, width: 1.5, backgroundColor: colors.border, top: 0 },
  // Active trip
  activeCard: { backgroundColor: colors.paper, borderRadius: radius.xl, padding: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 24 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  livePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 7, borderRadius: radius.full, backgroundColor: colors.successLight, gap: 7 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success },
  liveText: { fontFamily: 'Inter_800ExtraBold', color: colors.success, fontSize: 10, letterSpacing: 1 },
  cardMeta: { fontFamily: 'Inter_700Bold', color: colors.textMuted, fontSize: 10, letterSpacing: 1 },
  activeArt: { height: 138, borderRadius: 20, backgroundColor: colors.sage, overflow: 'hidden', marginBottom: 20, alignItems: 'center', justifyContent: 'center' },
  activeArtImage: { opacity: isDark ? 0.14 : 0.9 },
  activeArtOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: isDark ? 'rgba(6, 12, 9, 0.86)' : 'rgba(24, 52, 43, 0.44)' },
  photoShapeOne: { position: 'absolute', width: 180, height: 220, borderRadius: 28, backgroundColor: colors.sageDark, transform: [{ rotate: '-19deg' }, { translateX: -55 }, { translateY: 12 }] },
  photoShapeTwo: { position: 'absolute', width: 150, height: 190, borderRadius: 26, backgroundColor: colors.primary, transform: [{ rotate: '17deg' }, { translateX: 78 }, { translateY: -16 }] },
  artIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: 'rgba(31,41,38,0.9)', alignItems: 'center', justifyContent: 'center' },
  activeTitle: { fontFamily: 'Inter_700Bold', color: colors.textPrimary, fontSize: 22, letterSpacing: -0.2, marginBottom: 8 },
  activeSub: { fontFamily: 'Inter_400Regular', color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 20 },
  cardButton: { marginBottom: 0 },
});
