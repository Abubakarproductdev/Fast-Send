/**
 * NotificationService.ts
 *
 * Manages all local push notifications for FastSend:
 *  - Requesting permission on Android/iOS
 *  - Scheduling repeating "push your photos" reminders every 2 hours
 *  - Cancelling reminders when a trip ends
 *  - Showing an immediate "upload complete" notification
 *
 * All notification IDs are stored in AsyncStorage so they survive app restarts
 * and can be reliably cancelled later.
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ── Constants ─────────────────────────────────────────────────────────

const NOTIFICATION_IDS_KEY = 'scheduled_notification_ids';
const REMINDER_COUNT = 12; // Schedule 12 reminders = 24 hours of coverage

// ── Configuration ─────────────────────────────────────────────────────

// How notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ── Permission ────────────────────────────────────────────────────────

/**
 * Request notification permissions from the user.
 * Returns true if granted, false otherwise.
 * Safe to call multiple times — will not re-prompt if already granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  // Android 13+ requires explicit notification permission
  if (Platform.OS === 'android') {
    const channel = await Notifications.getNotificationChannelAsync('fastsend-reminders');
    if (!channel) {
      await Notifications.setNotificationChannelAsync('fastsend-reminders', {
        name: 'Photo Upload Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F59E0B',
        sound: null,
      });
    }
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ── Schedule reminders ────────────────────────────────────────────────

/**
 * Schedule repeating "push photos" reminders every 2 hours for 24 hours.
 * Call this right after a trip is created.
 * Cancels any previously scheduled reminders first.
 */
export async function scheduleUploadReminders(intervalHours = 2): Promise<void> {
  try {
    // Cancel any existing reminders before scheduling new ones
    await cancelAllUploadReminders();

    const granted = await requestNotificationPermission();
    if (!granted) {
      console.warn('[NotificationService] Permission not granted — skipping reminder scheduling.');
      return;
    }

    const ids: string[] = [];
    const now = Date.now();

    for (let i = 1; i <= REMINDER_COUNT; i++) {
      const triggerMs = now + i * intervalHours * 60 * 60 * 1000;

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📷 Time to push your photos!',
          body: `Your guests are waiting. Tap to sync ${i * intervalHours > 12 ? 'the latest' : 'new'} photos from your trip.`,
          data: { type: 'upload_reminder' },
          categoryIdentifier: 'upload_reminder',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(triggerMs),
        },
      });

      ids.push(id);
    }

    // Persist IDs for later cancellation
    await AsyncStorage.setItem(NOTIFICATION_IDS_KEY, JSON.stringify(ids));
    console.log(`[NotificationService] Scheduled ${ids.length} upload reminders.`);
  } catch (e) {
    console.error('[NotificationService] Failed to schedule reminders:', e);
  }
}

// ── Cancel reminders ──────────────────────────────────────────────────

/**
 * Cancel all scheduled upload reminders.
 * Call this when the trip ends.
 */
export async function cancelAllUploadReminders(): Promise<void> {
  try {
    // Cancel by stored IDs
    const stored = await AsyncStorage.getItem(NOTIFICATION_IDS_KEY);
    if (stored) {
      const ids: string[] = JSON.parse(stored);
      await Promise.all(ids.map(id => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
      await AsyncStorage.removeItem(NOTIFICATION_IDS_KEY);
      console.log(`[NotificationService] Cancelled ${ids.length} scheduled reminders.`);
    }

    // Belt-and-suspenders: also cancel everything (catches any orphaned IDs)
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.error('[NotificationService] Failed to cancel reminders:', e);
  }
}

// ── Immediate notifications ───────────────────────────────────────────

/**
 * Show an immediate local notification to confirm photos were uploaded.
 */
export async function notifyUploadComplete(count: number): Promise<void> {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `✅ ${count} photo${count !== 1 ? 's' : ''} uploaded!`,
        body: 'Your guests can now see the latest photos from the trip.',
        data: { type: 'upload_complete' },
      },
      trigger: null, // Fire immediately
    });
  } catch (e) {
    console.error('[NotificationService] Failed to show upload complete notification:', e);
  }
}

/**
 * Show an immediate notification confirming the trip has ended.
 */
export async function notifyTripEnded(): Promise<void> {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 Trip ended!',
        body: 'Guests will receive their personal photo galleries automatically.',
        data: { type: 'trip_ended' },
      },
      trigger: null,
    });
  } catch (e) {
    console.error('[NotificationService] Failed to show trip ended notification:', e);
  }
}
