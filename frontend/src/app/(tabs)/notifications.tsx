import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, SafeAreaView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { API_BASE_URL } from '../../config/api';
import { colors } from '../../theme/colors';

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
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    try {
      await fetch(`${API_BASE_URL}/api/v1/notifications/${id}/read`, {
        method: 'PATCH',
      });
    } catch (e) {
      console.error("Failed to mark as read");
    }
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity 
      style={[styles.card, !item.is_read && styles.cardUnread]}
      onPress={() => !item.is_read && markAsRead(item.id)}
      activeOpacity={0.7}
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>
      
      {notifications.length === 0 && !loading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyTitle}>You're all caught up!</Text>
          <Text style={styles.emptyText}>When your photos finish processing, you'll see a notification here.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.amber} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 16,
    backgroundColor: colors.bgBase,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textBase,
    letterSpacing: -0.5,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardUnread: {
    backgroundColor: colors.bgCardElevated,
    borderColor: colors.amber + '40', // slightly visible border
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.amber,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textBase,
    flex: 1,
  },
  titleUnread: {
    fontWeight: '700',
    color: colors.textBase,
  },
  timeText: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 8,
  },
  message: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    paddingLeft: 16, // align with title if there was a dot
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textBase,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
