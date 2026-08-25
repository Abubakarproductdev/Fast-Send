import { API_BASE_URL } from '../config/api';
import { ApiError, NetworkError, parseApiErrorResponse } from '../utils/errors';

const REQUEST_TIMEOUT_MS = 30000;

export interface TripResponse {
  id: string;
  organizer_id: string;
  name: string;
  invite_code: string;
  is_active: boolean;
  created_at: string;
  registration_url: string;
}

export interface TripDetail extends TripResponse {
  attendee_count: number;
  media_count: number;
}

export interface SyncResponse {
  organizer_id: string;
  message: string;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new NetworkError('Request timed out. Please try again.');
    }
    throw new NetworkError();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    if (response.status === 204) return undefined as T;
    try {
      return await response.json();
    } catch {
      throw new ApiError('Invalid response from server.', response.status);
    }
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  throw new ApiError(parseApiErrorResponse(response.status, body), response.status);
}

export const api = {
  async syncOrganizer(firebaseUid: string, email: string | null, name?: string): Promise<SyncResponse> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/v1/auth/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firebase_uid: firebaseUid,
        email: email || '',
        name: name || '',
      }),
    });
    return handleResponse<SyncResponse>(response);
  },

  async createTrip(organizerId: string, name: string): Promise<TripResponse> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/v1/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizer_id: organizerId, name }),
    });
    return handleResponse<TripResponse>(response);
  },

  async getTrip(tripId: string): Promise<TripDetail> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/v1/trips/${tripId}`);
    return handleResponse<TripDetail>(response);
  },

  async getOrganizerTrips(organizerId: string, limit = 6, skip = 0, search = ''): Promise<TripDetail[]> {
    const query = new URLSearchParams({ limit: String(limit), skip: String(skip) });
    if (search) query.append('search', search);
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/v1/trips/organizer/${organizerId}?${query.toString()}`);
    return handleResponse<TripDetail[]>(response);
  },

  async endTrip(tripId: string): Promise<TripResponse> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/v1/trips/${tripId}/end`, {
      method: 'POST',
    });
    return handleResponse<TripResponse>(response);
  },

  async reliveTrip(tripId: string, organizerId: string): Promise<TripResponse> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/v1/trips/${tripId}/relive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizer_id: organizerId }),
    });
    return handleResponse<TripResponse>(response);
  },

  async deleteTrip(tripId: string, organizerId: string): Promise<void> {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/v1/trips/${tripId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizer_id: organizerId }),
    });
    await handleResponse(response);
  },

  async uploadMedia(
    tripId: string,
    fileUri: string,
    deviceLocalId: string,
  ): Promise<void> {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      type: 'image/jpeg',
      name: `${deviceLocalId}.jpg`,
    } as unknown as Blob);
    formData.append('device_local_id', deviceLocalId);

    const response = await fetchWithTimeout(
      `${API_BASE_URL}/api/v1/trips/${tripId}/media`,
      {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
      },
      120000,
    );
    await handleResponse(response);
  },

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/`, {}, 5000);
      return response.ok;
    } catch {
      return false;
    }
  },
};
