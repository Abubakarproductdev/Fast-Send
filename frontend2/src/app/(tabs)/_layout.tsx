import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { shadows } from '../../theme/spacing';
import { API_BASE_URL } from '../../config/api';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabIconProps {
  name: IoniconName;
  focused: boolean;
  badge?: number;
}

const TabIcon = ({ name, focused, badge }: TabIconProps) => {
  const scale = useSharedValue(1);
  const outlineName = `${name}-outline` as IoniconName;

  useEffect(() => {
    scale.value = withSpring(focused ? 1.1 : 1, { damping: 14, stiffness: 300 });
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.iconContainer}>
      <Animated.View style={[styles.iconWrap, focused && styles.iconWrapActive, animatedStyle]}>
        <Ionicons
          name={focused ? name : outlineName}
          size={22}
          color={focused ? colors.textOnLime : colors.textMuted}
        />
      </Animated.View>
      {!!badge && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </View>
  );
};

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
      } catch (_) {
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
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarBackground: () => <View style={{ flex: 1, backgroundColor: 'transparent' }} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: 'Archive',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="folder" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="notifications" focused={focused} badge={unreadCount} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="settings" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.bgCard,
    height: 68,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 999,
    paddingBottom: 8,
    paddingTop: 8,
    position: 'absolute',
    borderWidth: 1,
    borderColor: colors.border,
    // Remove borderTopWidth — the outer borderWidth already handles all sides
    ...shadows.md,
  },
  tabLabel: {
    fontSize: typography.size.xs,  // 11px tab label
    fontFamily: typography.fontSemiBold,
    marginTop: 2,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapActive: {
    backgroundColor: colors.lime,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.bgCard,
  },
  badgeText: {
    color: colors.textPrimary,
    fontSize: typography.size.xs - 2,  // 9px — smaller than xs for tight badge
    fontFamily: typography.fontBold,
  },
});
