import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Animated } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { API_BASE_URL } from '../../config/api';
import { colors } from '../../theme/colors';
import { ScreenShell } from '../../components/ScreenShell';
import { radius } from '../../theme/spacing';

interface Notification {
  id: string;
  trip_id: string | null;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsTab() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/notifications`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.warn("Failed to fetch notifications", e);
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
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    try {
      await fetch(`${API_BASE_URL}/api/v1/notifications/${id}/read`, {
        method: 'PATCH',
      });
    } catch (e) {}
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity 
      style={[styles.card, !item.is_read && styles.cardUnread]}
      onPress={() => !item.is_read && markAsRead(item.id)}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          {!item.is_read && <View style={styles.unreadDot} />}
          <Text style={[styles.title, !item.is_read && styles.titleUnread]}>{item.title}</Text>
        </View>
        <Text style={styles.timeText}>
          {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
        </Text>
      </View>
      <Text style={styles.message}>{item.message}</Text>
    </TouchableOpacity>
  );

  return (
    <ScreenShell>
      <View style={styles.header}>
        <Text style={styles.preTitle}>UPDATES</Text>
        <Text style={styles.headerTitle}>Inbox</Text>
      </View>
      
      {notifications.length === 0 && !loading ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Text style={styles.emptyEmoji}>🔔</Text>
            <View style={styles.emptyGlow} />
          </View>
          <Text style={styles.emptyTitle}>All caught up</Text>
          <Text style={styles.emptyText}>When your photos finish processing, we'll notify you here.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        />
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 20,
    marginBottom: 32,
  },
  preTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 2,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  listContainer: {
    paddingBottom: 120,
    gap: 16,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: 20,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  cardUnread: {
    borderColor: colors.primaryGlow,
    backgroundColor: colors.bgElevated,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  titleUnread: {
    fontWeight: '800',
  },
  timeText: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 8,
    fontWeight: '600',
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    fontWeight: '400',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyEmoji: {
    fontSize: 40,
    zIndex: 2,
  },
  emptyGlow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryGlow,
    zIndex: 1,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
});
