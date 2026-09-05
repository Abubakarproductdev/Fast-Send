import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles, Check, BellOff } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { api, AppNotification } from '../../services/api';
import { StatusBar } from '../../components/StatusBar';
import { useTheme } from '../../theme/ThemeContext';

const formatNoticeDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function InboxScreen() {
  const { colors, neoShadow } = useTheme();
  const router = useRouter();
  const { organizerId } = useAuth();
  const [notices, setNotices] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const loadNotices = useCallback(async () => {
    if (!organizerId) return;
    try {
      const list = await api.listNotifications(organizerId);
      setNotices(list);
    } catch {}
  }, [organizerId]);

  useEffect(() => {
    setLoading(true);
    loadNotices().finally(() => setLoading(false));
  }, [loadNotices]);

  const handleOpenNotice = async (notice: AppNotification) => {
    if (!notice.is_read) {
      setNotices((prev) =>
        prev.map((n) => (n.id === notice.id ? { ...n, is_read: true } : n)),
      );
      api.markNotificationRead(notice.id).catch(() => {});
    }

    if (notice.trip_id) {
      router.push(`/trip-details?tripId=${notice.trip_id}`);
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
      paddingHorizontal: 16,
      paddingTop: 8,
      marginBottom: 16,
    },
    eyebrow: {
      fontSize: 12,
      fontFamily: 'Nunito_900Black',
      fontWeight: '900',
      textTransform: 'uppercase',
      letterSpacing: 2,
      color: colors.flame,
      marginBottom: 4,
    },
    title: {
      fontSize: 36,
      fontFamily: 'Nunito_900Black',
      fontWeight: '900',
      color: colors.ink,
    },
    listSection: {
      paddingHorizontal: 16,
      gap: 12,
    },
    noticeCard: {
      borderRadius: 20,
      borderWidth: 2,
      borderColor: colors.ink,
      backgroundColor: colors.flameSoft,
      padding: 14,
    },
    noticeRead: {
      opacity: 0.55,
    },
    cardRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    avatarWrap: {
      position: 'relative',
    },
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 2,
      borderColor: colors.ink,
      backgroundColor: colors.white,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      borderColor: colors.ink,
      backgroundColor: colors.leaf,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardCopy: {
      flex: 1,
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: 8,
    },
    noticeTitle: {
      flex: 1,
      fontSize: 15,
      fontFamily: 'Nunito_900Black',
      fontWeight: '900',
      color: colors.ink,
    },
    noticeDate: {
      fontSize: 11,
      fontFamily: 'Nunito_700Bold',
      fontWeight: '700',
      color: colors.mut,
    },
    noticeBody: {
      fontSize: 13,
      fontFamily: 'Nunito_700Bold',
      fontWeight: '700',
      lineHeight: 18,
      color: 'rgba(16, 16, 16, 0.65)',
      marginTop: 6,
    },
    emptyCard: {
      borderRadius: 22,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: 'rgba(16, 16, 16, 0.25)',
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
      padding: 28,
      alignItems: 'center',
      marginTop: 10,
    },
    emptyTitle: {
      fontSize: 17,
      fontFamily: 'Nunito_900Black',
      fontWeight: '900',
      color: colors.ink,
      marginTop: 8,
    },
    emptySub: {
      fontSize: 13,
      fontFamily: 'Nunito_700Bold',
      fontWeight: '700',
      color: colors.mut,
      marginTop: 4,
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadNotices}
            tintColor={colors.flame}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>UPDATES</Text>
          <Text style={styles.title}>Notifications</Text>
        </View>

        {/* Notices list */}
        <View style={styles.listSection}>
          {notices.map((n) => {
            const isRead = n.is_read;
            return (
              <TouchableOpacity
                key={n.id}
                onPress={() => handleOpenNotice(n)}
                style={[
                  styles.noticeCard,
                  isRead && styles.noticeRead,
                  neoShadow,
                ]}
                activeOpacity={0.8}
              >
                <View style={styles.cardRow}>
                  <View style={styles.avatarWrap}>
                    <View style={styles.iconCircle}>
                      <Sparkles size={17} strokeWidth={2.6} color={colors.flame} />
                    </View>
                    {isRead ? (
                      <View style={styles.checkBadge}>
                        <Check size={11} strokeWidth={4} color={colors.cream} />
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.cardCopy}>
                    <View style={styles.titleRow}>
                      <Text style={styles.noticeTitle} numberOfLines={1}>
                        {n.title}
                      </Text>
                      <Text style={styles.noticeDate}>
                        {formatNoticeDate(n.created_at)}
                      </Text>
                    </View>
                    <Text style={styles.noticeBody}>{n.message}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {!loading && notices.length === 0 ? (
            <View style={styles.emptyCard}>
              <BellOff size={24} strokeWidth={2.6} color={colors.mut} />
              <Text style={styles.emptyTitle}>All caught up</Text>
              <Text style={styles.emptySub}>
                Trip reminders and updates will land here.
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
