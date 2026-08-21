import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { colors } from '../../theme/colors';
import { API_BASE_URL } from '../../config/api';

const TabIcon = ({ emoji, focused, badge }: { emoji: string; focused: boolean; badge?: number }) => (
  <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
    <Text style={[styles.emoji, focused && styles.emojiActive]}>{emoji}</Text>
    {!!badge && badge > 0 && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
      </View>
    )}
  </View>
);

export default function TabLayout() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/notifications`);
        if (res.ok) {
          const data = await res.json();
          const unread = data.filter((n: any) => !n.is_read).length;
          setUnreadCount(unread);
        }
      } catch (e) {
        // silent fail for polling
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.borderStrong,
          borderTopWidth: 1.5,
          height: 84,
          paddingBottom: 24,
          paddingTop: 12,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: 'Archive',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📁" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔔" focused={focused} badge={unreadCount} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapActive: {
    backgroundColor: colors.primaryGlow,
  },
  emoji: {
    fontSize: 22,
    opacity: 0.6,
  },
  emojiActive: {
    opacity: 1,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.error,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.bgCard,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
});
