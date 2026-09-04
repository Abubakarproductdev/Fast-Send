import AsyncStorage from '@react-native-async-storage/async-storage';

const ORGANIZER_ID_KEY = '@fastsend_organizer_id';
const ACTIVE_TRIP_KEY = 'activeTripId';
const TRIP_START_KEY = 'tripStartTime';
const RENAMES_KEY = '@fastsend_trip_renames';
const QUALITY_KEY = '@fastsend_image_quality';
const UPLOAD_MODE_KEY = '@fastsend_upload_mode';
const SYNC_INTERVAL_KEY = '@fastsend_sync_interval';

export const storage = {
  async getOrganizerId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(ORGANIZER_ID_KEY);
    } catch {
      return null;
    }
  },
  async setOrganizerId(id: string | null): Promise<void> {
    try {
      if (id === null) await AsyncStorage.removeItem(ORGANIZER_ID_KEY);
      else await AsyncStorage.setItem(ORGANIZER_ID_KEY, id);
    } catch {}
  },

  async getActiveTripId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(ACTIVE_TRIP_KEY);
    } catch {
      return null;
    }
  },
  async setActiveTripId(id: string | null): Promise<void> {
    try {
      if (id === null) await AsyncStorage.removeItem(ACTIVE_TRIP_KEY);
      else await AsyncStorage.setItem(ACTIVE_TRIP_KEY, id);
    } catch {}
  },

  async getTripStartTime(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TRIP_START_KEY);
    } catch {
      return null;
    }
  },
  async setTripStartTime(time: string | null): Promise<void> {
    try {
      if (time === null) await AsyncStorage.removeItem(TRIP_START_KEY);
      else await AsyncStorage.setItem(TRIP_START_KEY, time);
    } catch {}
  },

  async getImageQuality(): Promise<string> {
    try {
      const q = await AsyncStorage.getItem(QUALITY_KEY);
      return q || 'High (1080p)';
    } catch {
      return 'High (1080p)';
    }
  },
  async setImageQuality(quality: string): Promise<void> {
    try {
      await AsyncStorage.setItem(QUALITY_KEY, quality);
    } catch {}
  },

  async getUploadMode(): Promise<'wifi_only' | 'wifi_and_cellular'> {
    try {
      const m = await AsyncStorage.getItem(UPLOAD_MODE_KEY);
      return (m as 'wifi_only' | 'wifi_and_cellular') || 'wifi_and_cellular';
    } catch {
      return 'wifi_and_cellular';
    }
  },
  async setUploadMode(mode: 'wifi_only' | 'wifi_and_cellular'): Promise<void> {
    try {
      await AsyncStorage.setItem(UPLOAD_MODE_KEY, mode);
    } catch {}
  },

  async getSyncIntervalHours(): Promise<number> {
    try {
      const s = await AsyncStorage.getItem(SYNC_INTERVAL_KEY);
      return s ? parseInt(s, 10) : 6;
    } catch {
      return 6;
    }
  },
  async setSyncIntervalHours(hours: number): Promise<void> {
    try {
      await AsyncStorage.setItem(SYNC_INTERVAL_KEY, String(hours));
    } catch {}
  },

  async getTripRenames(): Promise<Record<string, string>> {
    try {
      const raw = await AsyncStorage.getItem(RENAMES_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },
  async setTripRename(tripId: string, name: string): Promise<void> {
    try {
      const all = await storage.getTripRenames();
      all[tripId] = name;
      await AsyncStorage.setItem(RENAMES_KEY, JSON.stringify(all));
    } catch {}
  },

  async getSyncedPhotoIds(tripId: string): Promise<string[]> {
    try {
      const raw = await AsyncStorage.getItem(`syncedPhotos_${tripId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },
  async setSyncedPhotoIds(tripId: string, ids: string[]): Promise<void> {
    try {
      await AsyncStorage.setItem(`syncedPhotos_${tripId}`, JSON.stringify(ids));
    } catch {}
  },
};
