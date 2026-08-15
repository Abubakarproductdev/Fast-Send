import React, { useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius, shadows } from '../../theme/spacing';

// ─── Live Pulse dot ──────────────────────────────────────────────────────────
const LiveDot = () => {
  const ringScale   = useSharedValue(1);
  const ringOpacity = useSharedValue(1);
  const dotScale    = useSharedValue(1);

  useEffect(() => {
    ringScale.value = withRepeat(
      withSequence(
        withTiming(2.4, { duration: 1400, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 0 }),
      ),
      -1,
    );
    ringOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1400, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 0 }),
      ),
      -1,
    );
    dotScale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 700, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.0, { duration: 700, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));
  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
  }));

  return (
    <View style={liveDotStyles.container}>
      <Animated.View style={[liveDotStyles.ring, ringStyle]} />
      <Animated.View style={[liveDotStyles.dot, dotStyle]} />
    </View>
  );
};

const liveDotStyles = StyleSheet.create({
  container: { width: 16, height: 16, justifyContent: 'center', alignItems: 'center' },
  ring: {
    position: 'absolute',
    width: 10, height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(34,197,94,0.6)',
  },
  dot: {
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
});

// ─── Feature card ─────────────────────────────────────────────────────────────
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const FeatureCard = ({ icon, title, desc }: { icon: IoniconName; title: string; desc: string }) => {
  const scale = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[featureStyles.card, cardStyle]}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={() => { scale.value = withSpring(0.96, { damping: 15, stiffness: 400 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 12, stiffness: 300 }); }}
        style={featureStyles.inner}
      >
        <View style={featureStyles.iconWrap}>
          <Ionicons name={icon} size={20} color={colors.lime} />
        </View>
        <Text style={featureStyles.title}>{title}</Text>
        <Text style={featureStyles.desc}>{desc}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const featureStyles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  inner: {
    padding: spacing.md,
    gap: 6,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.limeGlow,
    borderWidth: 1,
    borderColor: 'rgba(196,241,53,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: typography.size.sm,
    fontFamily: typography.fontSemiBold,
    color: colors.textPrimary,
  },
  desc: {
    fontSize: typography.size.xs,
    fontFamily: typography.fontRegular,
    color: colors.textMuted,
    lineHeight: 16,
  },
});

// ─── Home Screen ─────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const { user, activeTripId } = useAuth();

  const displayName = (user as any)?.displayName || 'Organizer';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const timeOfDay = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Staggered animations — all hooks declared unconditionally at top level
  const headerOp   = useSharedValue(0);
  const headerTy   = useSharedValue(22);
  const liveOp     = useSharedValue(0);
  const liveTy     = useSharedValue(22);
  const ctaOp      = useSharedValue(0);
  const ctaTy      = useSharedValue(22);
  const featOp     = useSharedValue(0);
  const featTy     = useSharedValue(22);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOp.value,
    transform: [{ translateY: headerTy.value }],
  }));
  const liveStyle = useAnimatedStyle(() => ({
    opacity: liveOp.value,
    transform: [{ translateY: liveTy.value }],
  }));
  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOp.value,
    transform: [{ translateY: ctaTy.value }],
  }));
  const featStyle = useAnimatedStyle(() => ({
    opacity: featOp.value,
    transform: [{ translateY: featTy.value }],
  }));

  const EASING = Easing.out(Easing.cubic);
  const SPRING = { damping: 22, stiffness: 200 };

  useEffect(() => {
    // Header — immediate
    headerOp.value = withTiming(1, { duration: 380, easing: EASING });
    headerTy.value = withSpring(0, SPRING);
    // Live card / CTA — 80ms delay
    liveOp.value = withDelay(80, withTiming(1, { duration: 380, easing: EASING }));
    liveTy.value = withDelay(80, withSpring(0, SPRING));
    ctaOp.value  = withDelay(80, withTiming(1, { duration: 380, easing: EASING }));
    ctaTy.value  = withDelay(80, withSpring(0, SPRING));
    // Features — 160ms delay
    featOp.value = withDelay(160, withTiming(1, { duration: 380, easing: EASING }));
    featTy.value = withDelay(160, withSpring(0, SPRING));
  }, []);

  const handleTripAction = () => {
    router.push(activeTripId ? '/active-trip' : '/create-trip');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Subtle lime glow at top */}
      <LinearGradient
        colors={['rgba(196,241,53,0.05)', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.45 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header row */}
        <Animated.View style={[styles.headerRow, headerStyle]}>
          <View style={styles.headerLeft}>
            <Text style={styles.heading}>{displayName}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </Animated.View>

        {/* Active trip live card */}
        {activeTripId ? (
          <Animated.View style={liveStyle}>
          <TouchableOpacity
              style={styles.liveCard}
              activeOpacity={0.88}
              onPress={() => router.push('/active-trip')}
              accessibilityRole="button"
              accessibilityLabel="Active trip — tap to view"
            >
              <LinearGradient
                colors={['rgba(34,197,94,0.10)', 'rgba(34,197,94,0.03)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.liveLeft}>
                <View style={styles.livePill}>
                  <LiveDot />
                  <Text style={styles.livePillText}>LIVE</Text>
                </View>
                <Text style={styles.liveTitle}>Your trip is live</Text>
                <Text style={styles.liveSub}>Tap to push photos or view QR code</Text>
              </View>
              <View style={styles.liveRight}>
                <Ionicons name="chevron-forward" size={20} color={colors.success} />
              </View>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          /* CTA when no active trip */
          <Animated.View style={ctaStyle}>
            <View style={styles.ctaBlock}>
              <Text style={styles.ctaHeading}>Ready to share?</Text>
              <Text style={styles.ctaSub}>
                Create a trip and get a shareable QR code in seconds.
              </Text>
              <TouchableOpacity
                style={styles.ctaBtn}
                activeOpacity={0.88}
                onPress={handleTripAction}
              >
                <LinearGradient
                  colors={['#C4F135', '#96C018']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.ctaBtnGradient}
                >
                  <Ionicons name="add-circle" size={18} color={colors.textOnLime} style={{ marginRight: 6 }} />
                  <Text style={styles.ctaBtnText}>Start New Trip</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* How it works */}
        <Animated.View style={featStyle}>
          <View style={styles.featureGrid}>
            <FeatureCard
              icon="qr-code"
              title="Create & Share"
              desc="Generate a unique QR code guests scan to join your trip."
            />
            <FeatureCard
              icon="cloud-upload"
              title="Push Photos"
              desc="Upload photos from your camera roll with a single tap."
            />
            <FeatureCard
              icon="scan"
              title="AI Matching"
              desc="Each guest automatically gets only the photos they appear in."
            />
            <FeatureCard
              icon="people"
              title="Guest Access"
              desc="Guests view and download their photos via a private link."
            />
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 105, // clear floating tab bar
    gap: spacing.xl,
  },

  // ── Header ──
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30, 
  },
  headerLeft: { gap: 2 },
  eyebrow: {
    fontSize: typography.size.sm,
    fontFamily: typography.fontMedium,
    color: colors.textMuted,
  },
  heading: {
    fontSize: typography.size.xl,
    fontFamily: typography.fontExtraBold,
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.limeGlow,
    borderWidth: 1.5,
    borderColor: 'rgba(196,241,53,0.40)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: typography.size.sm,
    fontFamily: typography.fontBold,
    color: colors.lime,
  },

  // ── Live card ──
  liveCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
    backgroundColor: colors.bgCard,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    ...shadows.sm,
  },
  liveLeft: { gap: 6, flex: 1 },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.successLight,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.30)',
    marginBottom: 4,
  },
  livePillText: {
    fontSize: typography.size.xs,  // 11px — close enough for pill label
    fontFamily: typography.fontExtraBold,
    color: colors.success,
    letterSpacing: 2,
  },
  liveTitle: {
    fontSize: typography.size.md,
    fontFamily: typography.fontBold,
    color: colors.textPrimary,
  },
  liveSub: {
    fontSize: typography.size.sm,
    fontFamily: typography.fontRegular,
    color: colors.textSecondary,
  },
  liveRight: {
    paddingLeft: spacing.sm,
  },

  // ── CTA block ──
  ctaBlock: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.sm,
    alignItems: 'center',
    ...shadows.sm,
  },
  ctaHeading: {
    fontSize: typography.size.xl,
    fontFamily: typography.fontExtraBold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  ctaSub: {
    fontSize: typography.size.sm,
    fontFamily: typography.fontRegular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  ctaBtn: {
    borderRadius: radius.pill,
    overflow: 'hidden',
    width: '100%',
    shadowColor: colors.lime,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.40,
    shadowRadius: 18,
    elevation: 10,
  },
  ctaBtnGradient: {
    height: 52,
    borderRadius: radius.pill,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaBtnText: {
    fontSize: typography.size.base,
    fontFamily: typography.fontBold,
    color: colors.textOnLime,
    letterSpacing: 0.3,
  },

  // ── How it works ──
  sectionTitle: {
    fontSize: typography.size.xs,
    fontFamily: typography.fontBold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: -spacing.sm,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
