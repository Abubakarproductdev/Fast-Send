import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const NOTIFICATION_IDS_KEY = 'scheduled_notification_ids';
const REMINDER_COUNT = 12;

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (Platform.OS === 'android') {
    const channel = await Notifications.getNotificationChannelAsync('fastsend-reminders');
    if (!channel) {
      await Notifications.setNotificationChannelAsync('fastsend-reminders', {
        name: 'FastSend photo reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F4500A',
        sound: null,
      });
    }
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleUploadReminders(intervalHours = 2): Promise<void> {
  try {
    await cancelAllUploadReminders();

    const granted = await requestNotificationPermission();
    if (!granted) return;

    const ids: string[] = [];
    const now = Date.now();

    for (let i = 1; i <= REMINDER_COUNT; i++) {
      const triggerMs = now + i * intervalHours * 60 * 60 * 1000;

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'FastSend • Keep the moment moving',
          body: `Your guests are ready for new photos. Open FastSend to sync them.`,
          color: '#F4500A',
          data: { type: 'upload_reminder' },
          categoryIdentifier: 'upload_reminder',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(triggerMs),
          channelId: 'fastsend-reminders',
        },
      });

      ids.push(id);
    }

    await AsyncStorage.setItem(NOTIFICATION_IDS_KEY, JSON.stringify(ids));
  } catch (e) {
    console.error('[NotificationService] Failed to schedule reminders:', e);
  }
}

export async function cancelAllUploadReminders(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_IDS_KEY);
    if (stored) {
      const ids: string[] = JSON.parse(stored);
      await Promise.all(ids.map(id => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
      await AsyncStorage.removeItem(NOTIFICATION_IDS_KEY);
    }
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.error('[NotificationService] Failed to cancel reminders:', e);
  }
}

export async function notifyUploadComplete(count: number): Promise<void> {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `FastSend • ${count} photo${count !== 1 ? 's' : ''} ready`,
        body: 'Your guests can now see the latest moments from this trip.',
        color: '#F4500A',
        data: { type: 'upload_complete' },
      },
      trigger: null,
    });
  } catch (e) {
    console.error('[NotificationService] Failed to show upload complete notification:', e);
  }
}

export async function notifyTripEnded(): Promise<void> {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'FastSend • Collection saved',
        body: 'Your trip is wrapped. Guest photo access is ready.',
        color: '#F4500A',
        data: { type: 'trip_ended' },
      },
      trigger: null,
    });
  } catch (e) {
    console.error('[NotificationService] Failed to show trip ended notification:', e);
  }
}
