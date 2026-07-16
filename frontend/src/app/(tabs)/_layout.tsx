import { Tabs } from 'expo-router';
import { colors } from '../../theme/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.yellow,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.divider,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <span style={{ color, fontSize: 20 }}>🏠</span>,
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: 'Archive',
          tabBarIcon: ({ color }) => <span style={{ color, fontSize: 20 }}>📁</span>,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <span style={{ color, fontSize: 20 }}>⚙️</span>,
        }}
      />
    </Tabs>
  );
}
