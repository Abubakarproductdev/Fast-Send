import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { colors } from '../../theme/colors';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const TabIcon = ({
  name, focused, badge,
}: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  focused: boolean;
  badge?: number;
}) => (
  <TabIconInner name={name} focused={focused} badge={badge} />
);

const TabIconInner = ({ name, focused, badge }: { name: React.ComponentProps<typeof Ionicons>['name']; focused: boolean; badge?: number }) => {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
    <Ionicons name={name} size={20} color={focused ? colors.primary : colors.textMuted} />
    {!!badge && badge > 0 && (
      <View style={styles.badge}>
        <View style={styles.badgeDot} />
      </View>
    )}
  </View>;
};

export default function TabLayout() {
  const [unreadCount, setUnreadCount] = useState(0);
  const { organizerId } = useAuth();
  const { colors } = useTheme();

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const query = organizerId ? `?organizer_id=${encodeURIComponent(organizerId)}` : '';
        const res = await fetch(`${API_BASE_URL}/api/v1/notifications${query}`);
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.filter((n: any) => !n.is_read).length);
        }
      } catch (e) {
        // silent fail for polling
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [organizerId]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.paper,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 82,
          paddingBottom: 18,
          paddingTop: 10,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '800',
          letterSpacing: 0.8,
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ focused }) => <TabIcon name="grid-outline" focused={focused} /> }} />
      <Tabs.Screen name="trips" options={{ title: 'Archive', tabBarIcon: ({ focused }) => <TabIcon name="albums-outline" focused={focused} /> }} />
      <Tabs.Screen name="notifications" options={{ title: 'Inbox', tabBarIcon: ({ focused }) => <TabIcon name="notifications-outline" focused={focused} badge={unreadCount} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Profile', tabBarIcon: ({ focused }) => <TabIcon name="person-outline" focused={focused} /> }} />
    </Tabs>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  iconWrap: {
    width: 38,
    height: 32,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapActive: { backgroundColor: colors.primaryGlow },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.paper,
  },
  badgeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#FFFFFF' },
});
