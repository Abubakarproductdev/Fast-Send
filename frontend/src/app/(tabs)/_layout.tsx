import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { colors } from '../../theme/colors';
import { API_BASE_URL } from '../../config/api';

const TabIcon = ({ emoji, focused, badge }: { emoji: string; focused: boolean; badge?: number }) => (
  <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
    <Text style={styles.emoji}>{emoji}</Text>
    {!!badge && badge > 0 && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
      </View>
    )}
  </View>
);

export default function TabLayout() {
  const [unreadCount, setUnreadCount] = useState(0);

  // Poll for unread notifications every 15 seconds
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
        tabBarActiveTintColor: colors.amber,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
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
          title: 'Notifications',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔔" focused={focused} badge={unreadCount} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapActive: {
    backgroundColor: colors.amberGlow,
  },
  emoji: {
    fontSize: 20,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: colors.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.bgCard,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
