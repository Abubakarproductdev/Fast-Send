import * as Notifications from 'expo-notifications';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const LAST_SYNC_KEY = '@fastsend_last_sync_timestamp';

// Configure notification behavior when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class SyncService {
  /**
   * Request necessary permissions for Media Library and Notifications
   */
  static async requestPermissions() {
    const mediaStatus = await MediaLibrary.requestPermissionsAsync();
    const notifStatus = await Notifications.requestPermissionsAsync();
    
    return mediaStatus.status === 'granted' && notifStatus.status === 'granted';
  }

  /**
   * Call this when a trip starts to initialize the sync engine.
   * Schedules a recurring local notification every 2 hours.
   */
  static async startTripSync(intervalHours = 2) {
    // 1. Record the current time as the starting point for photo scanning
    await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());

    // 2. Schedule the recurring 2-hour notification reminder
    await Notifications.cancelAllScheduledNotificationsAsync(); // Clear any stale ones
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Keep the memories flowing! 📸",
        body: "Don't forget to upload your latest photos to the trip gallery.",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: intervalHours * 60 * 60,
        repeats: true,
      },
    });
  }

  /**
   * Call this when the trip ends to stop the reminders.
   */
  static async stopTripSync() {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.removeItem(LAST_SYNC_KEY);
  }

  /**
   * Call this when the user taps the notification or the "Push Photos" button.
   * Scans the camera roll for photos taken since the last sync.
   */
  static async performPhotoSync(): Promise<number> {
    const lastSyncStr = await AsyncStorage.getItem(LAST_SYNC_KEY);
    if (!lastSyncStr) return 0; // No active trip

    const lastSyncTimestamp = parseInt(lastSyncStr, 10);
    
    // Query the media library for photos created AFTER the last sync
    const media = await MediaLibrary.getAssetsAsync({
      mediaType: 'photo',
      createdAfter: lastSyncTimestamp, // Native filtering
      sortBy: 'creationTime',
    });

    if (media.assets.length === 0) {
      // Update timestamp anyway to prevent redundant scans
      await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
      return 0;
    }

    // TODO: Phase 6B -> Send `media.assets` array to the FastAPI backend!
    console.log(`Found ${media.assets.length} new photos to upload.`);
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Update the sync timestamp to NOW so we don't upload these again
    await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());

    return media.assets.length;
  }
}
