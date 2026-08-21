import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenShell } from '../../components/ScreenShell';
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
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, bounciness: 4, speed: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <ScreenShell>
      <Animated.View style={[styles.inner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        
        {/* Top Navigation / Branding */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>GOOD DAY</Text>
            <Text style={styles.dashboardTitle}>Dashboard</Text>
          </View>
          <TouchableOpacity style={styles.profileBtn} activeOpacity={0.7}>
            <Text style={styles.profileEmoji}>👤</Text>
          </TouchableOpacity>
        </View>

        {activeTripId ? (
          /* ACTIVE TRIP VIEW */
          <View style={styles.activeContainer}>
            <View style={styles.statusCard}>
              <View style={styles.statusHeader}>
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE SESSION</Text>
                </View>
                <Text style={styles.tripId}>ID: {activeTripId.slice(-6).toUpperCase()}</Text>
              </View>
              
              <Text style={styles.statusTitle}>Capture in Progress</Text>
              <Text style={styles.statusSub}>Your trip is active. Guests can join and receive photos instantly.</Text>
              
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>24</Text>
                  <Text style={styles.statLabel}>Guests</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>156</Text>
                  <Text style={styles.statLabel}>Photos</Text>
                </View>
              </View>

              <PrimaryButton
                title="Manage Live Trip"
                onPress={() => router.push('/active-trip')}
                style={styles.actionBtn}
              />
            </View>
          </View>
        ) : (
          /* IDLE / NO TRIP VIEW */
          <View style={styles.idleContainer}>
            <View style={styles.heroCard}>
              <View style={styles.heroIconWrap}>
                <Text style={styles.heroIcon}>✨</Text>
                <View style={styles.heroGlow} />
              </View>
              <Text style={styles.heroTitle}>Start Your Journey</Text>
              <Text style={styles.heroSub}>Create a new trip to share memories with your guests automatically.</Text>
              
              <PrimaryButton
                title="Create New Trip"
                onPress={() => router.push('/create-trip')}
                style={styles.heroBtn}
              />
            </View>

            <Text style={styles.sectionTitle}>PREMIUM FEATURES</Text>
            <View style={styles.featuresGrid}>
              {[
                { icon: '🤖', title: 'AI Matching', desc: 'Face recognition delivery' },
                { icon: '🔒', title: 'Private', desc: 'Secure guest galleries' },
              ].map((f, i) => (
                <View key={i} style={styles.featureCard}>
                  <Text style={styles.featureIcon}>{f.icon}</Text>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </Animated.View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  inner: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 2,
    marginBottom: 4,
  },
  dashboardTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  profileBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bgElevated,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileEmoji: {
    fontSize: 20,
  },
  // Active State
  activeContainer: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: 24,
    borderWidth: 1.5,
    borderColor: colors.primaryGlow,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.success,
    letterSpacing: 1,
  },
  tripId: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  statusSub: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: colors.border,
  },
  actionBtn: {
    marginBottom: 0,
  },
  // Idle State
  idleContainer: {
    flex: 1,
  },
  heroCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    marginBottom: 40,
  },
  heroIconWrap: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  heroIcon: {
    fontSize: 40,
    zIndex: 2,
  },
  heroGlow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryGlow,
    zIndex: 1,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  heroSub: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  heroBtn: {
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.textGold,
    letterSpacing: 2,
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  featureCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: 20,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 14,
  },
});
