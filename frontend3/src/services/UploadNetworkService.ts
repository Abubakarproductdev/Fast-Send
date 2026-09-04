import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';
import type { UploadMode } from './OrganizerSettingsService';

type NetworkModule = {
  getNetworkStateAsync?: () => Promise<{ isConnected?: boolean; type?: string }>;
};
type NetworkResult = { allowed: boolean; reason?: string };

let cachedNetworkModule: NetworkModule | null | undefined;

function getNetworkModule(): NetworkModule | null {
  if (cachedNetworkModule !== undefined) return cachedNetworkModule;
  cachedNetworkModule = requireOptionalNativeModule<NetworkModule>('ExpoNetwork');
  return cachedNetworkModule;
}

export async function checkUploadNetwork(uploadMode: UploadMode): Promise<NetworkResult> {
  if (Platform.OS === 'web') {
    const browser = typeof navigator !== 'undefined' ? navigator as Navigator & { connection?: { type?: string } } : undefined;
    if (browser?.onLine === false) return { allowed: false, reason: 'No internet connection.' };
    const type = browser?.connection?.type?.toLowerCase();
    if (uploadMode === 'wifi_only' && type && !['wifi', 'ethernet'].includes(type)) {
      return { allowed: false, reason: 'Wi-Fi is required for uploads.' };
    }
    return { allowed: true };
  }

  const network = getNetworkModule();
  if (!network?.getNetworkStateAsync) {
    return { allowed: true };
  }

  const state = await network.getNetworkStateAsync();
  if (!state.isConnected) return { allowed: false, reason: 'Connect to the internet before pushing photos.' };
  if (uploadMode === 'wifi_only' && state.type !== 'WIFI') {
    return { allowed: false, reason: 'Wi-Fi is required for uploads.' };
  }
  return { allowed: true };
}
