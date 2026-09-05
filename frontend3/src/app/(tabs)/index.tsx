import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Sparkles,
  Plus,
  Camera,
  QrCode,
  CloudUpload,
  Images,
  Download,
  ArrowDown,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTripModal } from '../../context/TripModalContext';
import { StatusBar } from '../../components/StatusBar';
import { useTheme } from '../../theme/ThemeContext';

export default function HomeScreen() {
  const { colors, neoShadow, neoShadowLg } = useTheme();
  const router = useRouter();
  const { user, activeTripId } = useAuth();
  const { openCreateTrip } = useTripModal();

  const STEPS = [
    {
      icon: Plus,
      solidBg: colors.flame,
      softBg: colors.flameSoft,
      title: activeTripId ? 'Manage your trip' : 'Create a new trip',
      body: activeTripId ? 'Your trip is live. Tap above to manage settings.' : 'Give your trip a name and start collecting moments.',
    },
    {
      icon: Camera,
      solidBg: colors.leaf,
      softBg: colors.leafSoft,
      title: 'Take your photos',
      body: 'Close the app and take all the photos you want.',
    },
    {
      icon: QrCode,
      solidBg: colors.sky,
      softBg: colors.skySoft,
      title: 'Share the code',
      body: 'Guests scan the QR or type the code — no app needed.',
    },
    {
      icon: CloudUpload,
      solidBg: colors.lagoon,
      softBg: colors.lagoonSoft,
      title: 'Photos upload themselves',
      body: 'Every shot syncs to the trip automatically.',
    },
    {
      icon: Images,
      solidBg: colors.brandDeep,
      softBg: 'rgba(246, 197, 0, 0.25)',
      title: 'Watch the gallery fill',
      body: 'Follow every moment as it lands, hour by hour.',
    },
    {
      icon: Download,
      solidBg: colors.ink,
      softBg: colors.creamDeep,
      title: 'Go home with everything',
      body: 'All photos land in every guest’s gallery.',
    },
  ];

  const getInitials = () => {
    const name = user?.displayName || user?.email?.split('@')[0] || 'Fast Send';
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || 'FS';
  };

  const handleHeroAction = () => {
    if (activeTripId) {
      router.push(`/trip-details?tripId=${activeTripId}`);
    } else {
      openCreateTrip();
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.cream,
    },
    scroll: {
      paddingBottom: 40,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 8,
      marginBottom: 12,
    },
    kicker: {
      fontSize: 17,
      fontFamily: 'Nunito_900Black',
      fontWeight: '900',
      textTransform: 'uppercase',
      letterSpacing: 2.2,
      color: colors.flame,
    },
    avatarBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: colors.ink,
      backgroundColor: colors.brand,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      fontSize: 14,
      fontFamily: 'Nunito_900Black',
      fontWeight: '900',
      color: colors.ink,
    },
    heroSection: {
      paddingHorizontal: 16,
    },
    heroCard: {
      borderRadius: 24,
      borderWidth: 1.5,
      borderTopWidth: 4,
      borderColor: colors.ink,
      backgroundColor: colors.leaf,
      padding: 20,
    },
    heroTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
    },
    heroCopy: {
      flex: 1,
    },
    heroEyebrow: {
      fontSize: 11,
      fontFamily: 'Nunito_800ExtraBold',
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1.8,
      color: 'rgba(248, 244, 233, 0.8)',
    },
    heroTitle: {
      fontSize: 32,
      fontFamily: 'Nunito_900Black',
      fontWeight: '900',
      lineHeight: 34,
      color: colors.cream,
      marginTop: 8,
    },
    sparkleBadge: {
      width: 48,
      height: 48,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: colors.ink,
      backgroundColor: colors.brand,
      justifyContent: 'center',
      alignItems: 'center',
      transform: [{ rotate: '6deg' }],
    },
    heroSub: {
      fontSize: 14,
      fontFamily: 'Nunito_700Bold',
      fontWeight: '700',
      lineHeight: 20,
      color: 'rgba(248, 244, 233, 0.85)',
      marginTop: 12,
    },
    tagWrap: {
      flexDirection: 'row',
      marginTop: 12,
    },
    pillTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: 999,
      borderWidth: 2,
      borderColor: colors.ink,
      backgroundColor: colors.cream,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.flame,
    },
    pillText: {
      fontSize: 11,
      fontFamily: 'Nunito_800ExtraBold',
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1.6,
      color: colors.ink,
    },
    heroBtn: {
      marginTop: 16,
      borderRadius: 999,
      borderWidth: 2,
      borderColor: colors.ink,
      backgroundColor: colors.brand,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroBtnText: {
      fontSize: 15,
      fontFamily: 'Nunito_900Black',
      fontWeight: '900',
      textTransform: 'uppercase',
      letterSpacing: 1.4,
      color: colors.ink,
    },
    stepsSection: {
      paddingHorizontal: 16,
      paddingTop: 24,
    },
    stepsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    stepsTitle: {
      fontSize: 13,
      fontFamily: 'Nunito_900Black',
      fontWeight: '900',
      textTransform: 'uppercase',
      letterSpacing: 1.6,
      color: colors.ink,
    },
    stepsCount: {
      fontSize: 11,
      fontFamily: 'Nunito_800ExtraBold',
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1.4,
      color: colors.mut,
    },
    stepsList: {
      marginTop: 4,
    },
    stepCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderRadius: 20,
      borderWidth: 1.5,
      borderTopWidth: 4,
      borderColor: colors.ink,
      padding: 14,
    },
    stepIconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.ink,
      justifyContent: 'center',
      alignItems: 'center',
    },
    stepCopy: {
      flex: 1,
    },
    stepTitle: {
      fontSize: 16,
      fontFamily: 'Nunito_900Black',
      fontWeight: '900',
      color: colors.ink,
      lineHeight: 18,
    },
    stepBody: {
      fontSize: 13,
      fontFamily: 'Nunito_700Bold',
      fontWeight: '700',
      color: colors.mut,
      marginTop: 4,
      lineHeight: 17,
    },
    stepNumberBadge: {
      width: 24,
      height: 24,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: colors.ink,
      justifyContent: 'center',
      alignItems: 'center',
    },
    stepNumberText: {
      fontSize: 13,
      fontFamily: 'Nunito_900Black',
      fontWeight: '900',
      color: colors.cream,
    },
    arrowRow: {
      alignItems: 'center',
      paddingVertical: 6,
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.kicker}>FAST SEND</Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile')}
            style={[styles.avatarBtn, neoShadow]}
            activeOpacity={0.8}
          >
            <Text style={styles.avatarText}>{getInitials()}</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Banner */}
        <View style={styles.heroSection}>
          <View style={[styles.heroCard, neoShadowLg]}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroCopy}>
                <Text style={styles.heroEyebrow}>
                  {activeTripId ? 'Your trip is live' : 'Share photos with everyone'}
                </Text>
                <Text style={styles.heroTitle}>
                  {activeTripId ? 'Manage your\nactive trip.' : 'Create a trip\nbefore you go.'}
                </Text>
              </View>
              <View style={[styles.sparkleBadge, neoShadow]}>
                <Sparkles size={24} strokeWidth={2.6} color={colors.ink} />
              </View>
            </View>

            <Text style={styles.heroSub}>
              {activeTripId 
                ? 'Your guests can join and upload photos to this trip right now.' 
                : 'Start a trip, take photos, and every guest gets their photos — automatically.'}
            </Text>

            <View style={styles.tagWrap}>
              <View style={styles.pillTag}>
                <View style={styles.dot} />
                <Text style={styles.pillText}>
                  {activeTripId ? 'Trip is live' : 'Moments, made easy'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleHeroAction}
              style={[styles.heroBtn, neoShadowLg]}
              activeOpacity={0.8}
            >
              <Text style={styles.heroBtnText}>
                {activeTripId ? 'MANAGE LIVE TRIP' : 'CREATE A NEW TRIP'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.stepsSection}>
          <View style={styles.stepsHeader}>
            <Text style={styles.stepsTitle}>HOW IT WORKS</Text>
            <Text style={styles.stepsCount}>6 SIMPLE STEPS</Text>
          </View>

          <View style={styles.stepsList}>
            {STEPS.map((s, i) => {
              const IconComponent = s.icon;
              return (
                <React.Fragment key={s.title}>
                  <View style={[styles.stepCard, { backgroundColor: s.softBg }]}>
                    <View style={[styles.stepIconBox, { backgroundColor: s.solidBg }]}>
                      <IconComponent
                        size={19}
                        strokeWidth={2.8}
                        color={s.solidBg === colors.brandDeep ? colors.ink : colors.cream}
                      />
                    </View>

                    <View style={styles.stepCopy}>
                      <Text style={styles.stepTitle}>{s.title}</Text>
                      <Text style={styles.stepBody}>{s.body}</Text>
                    </View>

                    <View style={[styles.stepNumberBadge, { backgroundColor: s.solidBg }]}>
                      <Text
                        style={[
                          styles.stepNumberText,
                          s.solidBg === colors.brandDeep && { color: colors.ink },
                        ]}
                      >
                        {i + 1}
                      </Text>
                    </View>
                  </View>

                  {i < STEPS.length - 1 ? (
                    <View style={styles.arrowRow}>
                      <ArrowDown size={17} strokeWidth={2.6} color={colors.mut} />
                    </View>
                  ) : null}
                </React.Fragment>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
