import React, { useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { LayoutGrid, Archive, Bell, UserRound } from 'lucide-react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useTripModal } from '../../context/TripModalContext';
import { api } from '../../services/api';
import { colors } from '../../theme/colors';

const POLL_INTERVAL_MS = 15000;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { organizerId } = useAuth();
  const { openCreateTrip } = useTripModal();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!organizerId) {
      setUnreadCount(0);
      return;
    }

    const fetchNotices = async () => {
      try {
        const list = await api.listNotifications(organizerId);
        const unread = list.filter((n) => !n.is_read).length;
        setUnreadCount(unread);
      } catch {}
    };

    fetchNotices();
    const interval = setInterval(fetchNotices, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [organizerId]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={({ state, navigation }) => {
        const currentRoute = state.routes[state.index].name;

        return (
          <View
            style={[
              styles.navContainer,
              {
                paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 16) : 12,
              },
            ]}
          >
            <View style={styles.navRow}>
              {/* Home */}
              <TouchableOpacity
                onPress={() => navigation.navigate('index')}
                style={styles.tabItem}
                activeOpacity={0.7}
              >
                <LayoutGrid
                  size={19}
                  strokeWidth={currentRoute === 'index' ? 2.8 : 2.2}
                  color={currentRoute === 'index' ? colors.ink : '#BCB8AD'}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    currentRoute === 'index' ? styles.tabLabelActive : styles.tabLabelInactive,
                  ]}
                >
                  Home
                </Text>
              </TouchableOpacity>

              {/* Archive */}
              <TouchableOpacity
                onPress={() => navigation.navigate('archive')}
                style={styles.tabItem}
                activeOpacity={0.7}
              >
                <Archive
                  size={19}
                  strokeWidth={currentRoute === 'archive' ? 2.8 : 2.2}
                  color={currentRoute === 'archive' ? colors.ink : '#BCB8AD'}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    currentRoute === 'archive' ? styles.tabLabelActive : styles.tabLabelInactive,
                  ]}
                >
                  Archive
                </Text>
              </TouchableOpacity>

              {/* Center Quick Create */}
              <TouchableOpacity
                onPress={openCreateTrip}
                style={styles.centerBtn}
                activeOpacity={0.8}
              >
                <Svg viewBox="0 0 40 40" width={22} height={22}>
                  <Path
                    d="M14 9h12l3 5h5a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V18a4 4 0 0 1 4-4h5l3-5z"
                    fill="#101010"
                  />
                  <Circle cx="20" cy="23" r="7" fill="#F6C500" />
                  <Circle cx="20" cy="23" r="3" fill="#101010" />
                </Svg>
              </TouchableOpacity>

              {/* Inbox */}
              <TouchableOpacity
                onPress={() => navigation.navigate('inbox')}
                style={styles.tabItem}
                activeOpacity={0.7}
              >
                <View style={styles.iconBox}>
                  <Bell
                    size={19}
                    strokeWidth={currentRoute === 'inbox' ? 2.8 : 2.2}
                    color={currentRoute === 'inbox' ? colors.ink : '#BCB8AD'}
                  />
                  {unreadCount > 0 ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.tabLabel,
                    currentRoute === 'inbox' ? styles.tabLabelActive : styles.tabLabelInactive,
                  ]}
                >
                  Inbox
                </Text>
              </TouchableOpacity>

              {/* Profile */}
              <TouchableOpacity
                onPress={() => navigation.navigate('profile')}
                style={styles.tabItem}
                activeOpacity={0.7}
              >
                <UserRound
                  size={19}
                  strokeWidth={currentRoute === 'profile' ? 2.8 : 2.2}
                  color={currentRoute === 'profile' ? colors.ink : '#BCB8AD'}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    currentRoute === 'profile' ? styles.tabLabelActive : styles.tabLabelInactive,
                  ]}
                >
                  Profile
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="archive" />
      <Tabs.Screen name="inbox" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    backgroundColor: colors.white,
    borderTopWidth: 2,
    borderTopColor: colors.ink,
    paddingTop: 6,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tabItem: {
    minWidth: 58,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 4,
  },
  iconBox: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    lineHeight: 12,
  },
  tabLabelActive: {
    fontWeight: '900',
    color: colors.ink,
  },
  tabLabelInactive: {
    fontWeight: '700',
    color: '#BCB8AD',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: colors.flame,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.ink,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: colors.cream,
  },
  centerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand,
    borderWidth: 2,
    borderColor: colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -8,
    shadowColor: 'rgba(16, 16, 16, 0.9)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
});
