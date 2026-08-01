import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

export default function HomeScreen() {
  const router = useRouter();
  const { activeTripId } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, bounciness: 6, speed: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.inner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

        {/* Top bar */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>Dashboard</Text>
            <Text style={styles.greetingSub}>
              {activeTripId ? 'A trip is live right now' : 'Ready to start a new trip?'}
            </Text>
          </View>
          <View style={styles.logoMark}>
            <Text style={{ fontSize: 22 }}>📷</Text>
          </View>
        </View>

        {activeTripId ? (
          /* === ACTIVE TRIP STATE === */
          <>
            {/* Live banner */}
            <View style={styles.liveBanner}>
              <View style={styles.liveBannerLeft}>
                <View style={styles.liveDot} />
                <View>
                  <Text style={styles.liveBannerTitle}>Trip is Live</Text>
                  <Text style={styles.liveBannerSub}>Guests can scan & register now</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.viewBtn}
                onPress={() => router.push('/active-trip')}
              >
                <Text style={styles.viewBtnText}>View →</Text>
              </TouchableOpacity>
            </View>

            {/* Quick action */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Quick Actions</Text>
              <PrimaryButton
                title="Push New Photos"
                onPress={() => router.push('/active-trip')}
              />
              <PrimaryButton
                title="View Trip Details"
                type="secondary"
                onPress={() => router.push('/active-trip')}
              />
            </View>
          </>
        ) : (
          /* === IDLE STATE === */
          <>
            {/* Hero card */}
            <View style={styles.heroCard}>
              <Text style={styles.heroEmoji}>📷</Text>
              <Text style={styles.heroTitle}>No active trip</Text>
              <Text style={styles.heroSub}>
                Create a trip to start sharing photos with your guests in real-time.
              </Text>
              <PrimaryButton
                title="Start New Trip"
                onPress={() => router.push('/create-trip')}
              />
            </View>

            {/* Feature hints */}
            <View style={styles.hintsRow}>
              {[
                { icon: '🤖', label: 'AI Face Match' },
                { icon: '📲', label: 'Instant Delivery' },
                { icon: '🔒', label: 'Private & Secure' },
              ].map(h => (
                <View key={h.label} style={styles.hintChip}>
                  <Text style={styles.hintIcon}>{h.icon}</Text>
                  <Text style={styles.hintLabel}>{h.label}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  greeting: {
    fontSize: typography.size.xxl,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  greetingSub: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  logoMark: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.amberGlow,
    borderWidth: 1,
    borderColor: colors.amber + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Live state
  liveBanner: {
    backgroundColor: colors.successLight,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.success + '30',
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  liveBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
  },
  liveBannerTitle: {
    fontSize: typography.size.base,
    fontWeight: '700',
    color: colors.success,
  },
  liveBannerSub: {
    fontSize: typography.size.xs,
    color: colors.success + 'AA',
    marginTop: 1,
  },
  viewBtn: {
    backgroundColor: colors.success,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  viewBtnText: {
    fontSize: typography.size.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  cardTitle: {
    fontSize: typography.size.base,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  // Idle state
  heroCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  heroEmoji: { fontSize: 56, marginBottom: spacing.sm },
  heroTitle: {
    fontSize: typography.size.xl,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  heroSub: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  hintsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  hintChip: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 4,
  },
  hintIcon: { fontSize: 20 },
  hintLabel: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
});
