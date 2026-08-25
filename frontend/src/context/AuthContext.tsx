import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { auth } from '../config/firebase';
import { api } from '../services/api';

const ORGANIZER_ID_KEY = '@fastsend_organizer_id';

async function readStoredOrganizerId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(ORGANIZER_ID_KEY);
  } catch {
    return null;
  }
}

async function storeOrganizerId(id: string | null): Promise<void> {
  if (id) await AsyncStorage.setItem(ORGANIZER_ID_KEY, id);
  else await AsyncStorage.removeItem(ORGANIZER_ID_KEY);
}

interface AuthContextType {
  user: User | null;
  organizerId: string | null;
  activeTripId: string | null;
  tripStartTime: string | null;
  isLoading: boolean;
  setOrganizerId: (id: string | null) => Promise<void>;
  setActiveTripId: (id: string | null) => Promise<void>;
  setTripStartTime: (time: string | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  organizerId: null,
  activeTripId: null,
  tripStartTime: null,
  isLoading: true,
  setOrganizerId: async () => {},
  setActiveTripId: async () => {},
  setTripStartTime: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organizerId, setOrganizerIdState] = useState<string | null>(null);
  const [activeTripId, setActiveTripIdState] = useState<string | null>(null);
  const [tripStartTime, setTripStartTimeState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadTripState = async () => {
      try {
        const storedTripId = await AsyncStorage.getItem('activeTripId');
        const storedStartTime = await AsyncStorage.getItem('tripStartTime');
        if (mounted) {
          if (storedTripId) setActiveTripIdState(storedTripId);
          if (storedStartTime) setTripStartTimeState(storedStartTime);
        }
      } catch (error) {
        console.error('Failed to load trip state', error);
      }
    };
    loadTripState();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) return;
      setUser(firebaseUser);

      if (!firebaseUser) {
        setOrganizerIdState(null);
        await storeOrganizerId(null).catch(() => {});
        if (mounted) setIsLoading(false);
        return;
      }

      const cachedOrganizerId = await readStoredOrganizerId();
      if (mounted && cachedOrganizerId) setOrganizerIdState(cachedOrganizerId);

      // Idempotently refresh the Mongo organizer link for the restored
      // Firebase user. This prevents stale organizer IDs after account changes.
      try {
        const synced = await api.syncOrganizer(firebaseUser.uid, firebaseUser.email, firebaseUser.displayName || undefined);
        if (mounted) setOrganizerIdState(synced.organizer_id);
        await storeOrganizerId(synced.organizer_id);
      } catch (error) {
        // Offline startup still works when the encrypted organizer ID cache is
        // available; the next successful startup refreshes it from the API.
        if (!cachedOrganizerId && mounted) setOrganizerIdState(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    });

    return () => { mounted = false; unsubscribe(); };
  }, []);

  const setOrganizerId = async (id: string | null) => {
    setOrganizerIdState(id);
    try { await storeOrganizerId(id); } catch (error) { console.error('Failed to persist organizer session', error); }
  };

  const setActiveTripId = async (id: string | null) => {
    try {
      if (id) await AsyncStorage.setItem('activeTripId', id);
      else await AsyncStorage.removeItem('activeTripId');
      setActiveTripIdState(id);
    } catch (error) { console.error('Failed to save trip id', error); }
  };

  const setTripStartTime = async (time: string | null) => {
    try {
      if (time) await AsyncStorage.setItem('tripStartTime', time);
      else await AsyncStorage.removeItem('tripStartTime');
      setTripStartTimeState(time);
    } catch (error) { console.error('Failed to save trip start time', error); }
  };

  return <AuthContext.Provider value={{ user, organizerId, activeTripId, tripStartTime, isLoading, setOrganizerId, setActiveTripId, setTripStartTime }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
