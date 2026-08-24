import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';

export type UploadMode = 'wifi_only' | 'wifi_and_cellular';
export const SYNC_INTERVAL_OPTIONS = [1, 2, 3, 4, 6, 12] as const;
export type SyncIntervalHours = typeof SYNC_INTERVAL_OPTIONS[number];

export interface OrganizerSettings {
  sync_interval_hours: number;
  upload_mode: UploadMode;
}

export const DEFAULT_ORGANIZER_SETTINGS: OrganizerSettings = {
  sync_interval_hours: 2,
  upload_mode: 'wifi_only',
};

const cacheKey = (organizerId: string) => `@fastsend_organizer_settings_${organizerId}`;

function normalizeSettings(value: Partial<OrganizerSettings> | null | undefined): OrganizerSettings {
  const interval = Number(value?.sync_interval_hours);
  return {
    sync_interval_hours: SYNC_INTERVAL_OPTIONS.includes(interval as SyncIntervalHours) ? interval : DEFAULT_ORGANIZER_SETTINGS.sync_interval_hours,
    upload_mode: value?.upload_mode === 'wifi_and_cellular' ? 'wifi_and_cellular' : 'wifi_only',
  };
}

export async function getCachedOrganizerSettings(organizerId: string | null): Promise<OrganizerSettings> {
  if (!organizerId) return DEFAULT_ORGANIZER_SETTINGS;
  try {
    const cached = await AsyncStorage.getItem(cacheKey(organizerId));
    return cached ? normalizeSettings(JSON.parse(cached)) : DEFAULT_ORGANIZER_SETTINGS;
  } catch {
    return DEFAULT_ORGANIZER_SETTINGS;
  }
}

export async function getOrganizerSettings(organizerId: string): Promise<OrganizerSettings> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/v1/auth/settings/${organizerId}`, {}, 8000);
    if (!response.ok) throw new Error('Unable to load organizer settings');
    const settings = normalizeSettings(await response.json());
    await AsyncStorage.setItem(cacheKey(organizerId), JSON.stringify(settings));
    return settings;
  } catch (error) {
    return getCachedOrganizerSettings(organizerId);
  }
}

export async function updateOrganizerSettings(organizerId: string, patch: Partial<OrganizerSettings>): Promise<OrganizerSettings> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/v1/auth/settings/${organizerId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  }, 8000);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || 'Unable to save organizer settings');
  }
  const settings = normalizeSettings(await response.json());
  await AsyncStorage.setItem(cacheKey(organizerId), JSON.stringify(settings));
  return settings;
}
