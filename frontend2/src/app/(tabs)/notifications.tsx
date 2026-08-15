import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, SafeAreaView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { API_BASE_URL } from '../../config/api';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius, shadows } from '../../theme/spacing';

interface Notification {
  id: string;
  trip_id: string | null;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });

const NotifCard = ({
  item,
  index,
  onPress,
}: {
  item: Notification;
  index: number;
  onPress: () => void;
}) => {
  const opacity = useSharedValue(0);
  const ty = useSharedValue(16);
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));

  useEffect(() => {
    opacity.value = withDelay(index * 50, withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }));
    ty.value = withDelay(index * 50, withSpring(0, { damping: 22, stiffness: 200 }));
  }, []);

  return (
    <Animated.View style={style}>
      <TouchableOpacity
        style={[styles.card, !item.is_read && styles.cardUnread]}
        onPress={onPress}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={item.is_read ? item.title : `Unread: ${item.title}`}
        accessibilityHint={item.is_read ? undefined : 'Tap to mark as read'}
      >
        {/* Unread lime left border accent */}
        {!item.is_read && (
          <View style={styles.unreadAccent} />
        )}
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              {!item.is_read && <View style={styles.unreadDot} />}
              <Text
                style={[styles.title, !item.is_read && styles.titleUnread]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
            </View>
            <Text style={styles.timeText}>{formatDate(item.created_at)}</Text>
          </View>
          <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function NotificationsTab() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const headerOpacity = useSharedValue(0);
  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/notifications`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.warn('Failed to fetch notifications', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAsRead = async (id: string) => {
    // Optimistic update
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
    try {
      await fetch(`${API_BASE_URL}/api/v1/notifications/${id}/read`, {
        method: 'PATCH',
      });
    } catch (e) {
      console.error('Failed to mark as read');
    }
  };

  const renderItem = ({ item, index }: { item: Notification; index: number }) => (
    <NotifCard
      item={item}
      index={index}
      onPress={() => !item.is_read && markAsRead(item.id)}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['rgba(196,241,53,0.03)', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.3 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {notifications.filter(n => !n.is_read).length > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>
              {notifications.filter(n => !n.is_read).length} new
            </Text>
          </View>
        )}
      </Animated.View>

      {notifications.length === 0 && !loading ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="mail-open-outline" size={40} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>You're all caught up!</Text>
          <Text style={styles.emptyText}>
            When your photos finish processing, you'll see a notification here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.lime}
              colors={[colors.lime]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 30,
  },
  headerTitle: {
    fontSize: typography.size.xxl,
    fontFamily: typography.fontExtraBold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  unreadBadge: {
    backgroundColor: colors.limeGlow,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(196,241,53,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  unreadBadgeText: {
    fontSize: typography.size.xs,
    fontFamily: typography.fontBold,
    color: colors.lime,
  },
  listContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 105,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    flexDirection: 'row',
    ...shadows.sm,
  },
  cardUnread: {
    backgroundColor: colors.bgElevated,
    borderColor: 'rgba(196,241,53,0.20)',
  },
  unreadAccent: {
    width: 3,
    backgroundColor: colors.lime,
    borderTopLeftRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
  },
  cardContent: {
    flex: 1,
    padding: spacing.md,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.lime,
    flexShrink: 0,
  },
  title: {
    fontSize: typography.size.base,
    fontFamily: typography.fontSemiBold,
    color: colors.textPrimary,
    flex: 1,
  },
  titleUnread: {
    fontFamily: typography.fontBold,
  },
  timeText: {
    fontSize: typography.size.xs,
    fontFamily: typography.fontRegular,
    color: colors.textMuted,
    flexShrink: 0,
  },
  message: {
    fontSize: typography.size.sm,
    fontFamily: typography.fontRegular,
    color: colors.textSecondary,
    lineHeight: 20,
    // Indent to visually align under the title (dot 7px + gap 6px = 13px)
    paddingLeft: 7 + 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: radius.lg,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontFamily: typography.fontBold,
    color: colors.textPrimary,
  },
  emptyText: {
    fontSize: typography.size.base,
    fontFamily: typography.fontRegular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
