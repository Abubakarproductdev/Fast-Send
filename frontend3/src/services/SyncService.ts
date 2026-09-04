import * as MediaLibrary from 'expo-media-library';
import * as ImageManipulator from 'expo-image-manipulator';
import { api } from './api';
import { storage } from '../utils/storage';
import { checkUploadNetwork } from './UploadNetworkService';
import { notifyUploadComplete } from './NotificationService';
import type { UploadMode } from './OrganizerSettingsService';

export interface SyncProgressCallback {
  (current: number, total: number): void;
}

export interface SyncResult {
  successCount: number;
  totalCount: number;
  errors: string[];
}

export class SyncService {
  static async requestPermissions(): Promise<boolean> {
    const { status } = await MediaLibrary.requestPermissionsAsync(false, ['photo'] as any);
    return status === 'granted';
  }

  static async pushPhotos(
    tripId: string,
    tripStartTime: string,
    uploadMode: UploadMode,
    quality: string,
    onProgress?: SyncProgressCallback,
  ): Promise<SyncResult> {
    const net = await checkUploadNetwork(uploadMode);
    if (!net.allowed) {
      throw new Error(net.reason || 'Network upload not allowed.');
    }

    const hasPermission = await SyncService.requestPermissions();
    if (!hasPermission) {
      throw new Error('Photo library permission is required.');
    }

    let normalizedTime = tripStartTime.trim();
    if (!normalizedTime.endsWith('Z') && !normalizedTime.includes('+')) {
      normalizedTime += 'Z';
    }
    const tripStartMs = new Date(normalizedTime).getTime() - 5000;

    let allAssets: MediaLibrary.Asset[] = [];
    let hasNextPage = true;
    let after: string | undefined = undefined;

    while (hasNextPage) {
      const result = await MediaLibrary.getAssetsAsync({
        mediaType: ['photo'],
        createdAfter: tripStartMs,
        after,
        first: 100,
      });
      allAssets = allAssets.concat(result.assets);
      hasNextPage = result.hasNextPage;
      after = result.endCursor;
    }

    const syncedIds = await storage.getSyncedPhotoIds(tripId);
    const syncedSet = new Set(syncedIds);
    const unsynced = allAssets.filter((a) => !syncedSet.has(a.id));

    if (unsynced.length === 0) {
      return { successCount: 0, totalCount: 0, errors: [] };
    }

    let targetWidth: number | null = 1080;
    if (quality === 'Medium (720p)') targetWidth = 720;
    else if (quality === 'Original (4K)') targetWidth = null;

    const errors: string[] = [];
    let successCount = 0;
    const batchId = `batch_${Date.now()}`;

    for (let i = 0; i < unsynced.length; i++) {
      const asset = unsynced[i];
      if (onProgress) onProgress(i + 1, unsynced.length);

      try {
        let uploadUri = asset.uri;
        if (targetWidth) {
          const manip = await ImageManipulator.manipulateAsync(
            asset.uri,
            [{ resize: { width: targetWidth } }],
            { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG },
          );
          uploadUri = manip.uri;
        }

        await api.uploadMedia(tripId, uploadUri, asset.id, batchId);
        syncedIds.push(asset.id);
        successCount++;
        await storage.setSyncedPhotoIds(tripId, syncedIds);
      } catch (err: any) {
        errors.push(`Failed: ${asset.filename || asset.id}`);
      }
    }

    if (successCount > 0) {
      await api.finalizeBatch(tripId, batchId);
      notifyUploadComplete(successCount).catch(() => {});
    }

    return {
      successCount,
      totalCount: unsynced.length,
      errors,
    };
  }
}
