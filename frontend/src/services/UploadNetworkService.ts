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
  // Unlike expo-network's JS wrapper, this optional lookup never throws when
  // Expo Go does not contain the native ExpoNetwork module.
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
    // Expo Go without the matching native module cannot expose the radio type.
    // Allow the upload rather than crashing the route; EAS builds use the
    // native check below.
    return { allowed: true };
  }

  const state = await network.getNetworkStateAsync();
  if (!state.isConnected) return { allowed: false, reason: 'Connect to the internet before pushing photos.' };
  if (uploadMode === 'wifi_only' && state.type !== 'WIFI') {
    return { allowed: false, reason: 'Wi-Fi is required for uploads.' };
  }
  return { allowed: true };
}
