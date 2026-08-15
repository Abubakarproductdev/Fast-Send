import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';

interface AuthContextType {
  user: User | null;
  organizerId: string | null;
  activeTripId: string | null;
  tripStartTime: string | null;
  isLoading: boolean;
  setOrganizerId: (id: string | null) => void;
  setActiveTripId: (id: string | null) => Promise<void>;
  setTripStartTime: (time: string | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  organizerId: null,
  activeTripId: null,
  tripStartTime: null,
  isLoading: true,
  setOrganizerId: () => {},
  setActiveTripId: async () => {},
  setTripStartTime: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organizerId, setOrganizerId] = useState<string | null>(null);
  const [activeTripId, setActiveTripIdState] = useState<string | null>(null);
  const [tripStartTime, setTripStartTimeState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load persisted state
    const loadState = async () => {
      try {
        const storedTripId = await AsyncStorage.getItem('activeTripId');
        if (storedTripId) setActiveTripIdState(storedTripId);

        const storedStartTime = await AsyncStorage.getItem('tripStartTime');
        if (storedStartTime) setTripStartTimeState(storedStartTime);
      } catch (e) {
        console.error('Failed to load state', e);
      }
    };
    loadState();

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const setActiveTripId = async (id: string | null) => {
    try {
      if (id) {
        await AsyncStorage.setItem('activeTripId', id);
      } else {
        await AsyncStorage.removeItem('activeTripId');
      }
      setActiveTripIdState(id);
    } catch (e) {
      console.error('Failed to save trip id', e);
    }
  };

  const setTripStartTime = async (time: string | null) => {
    try {
      if (time) {
        await AsyncStorage.setItem('tripStartTime', time);
      } else {
        await AsyncStorage.removeItem('tripStartTime');
      }
      setTripStartTimeState(time);
    } catch (e) {
      console.error('Failed to save trip start time', e);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      organizerId, 
      activeTripId, 
      tripStartTime, 
      isLoading, 
      setOrganizerId, 
      setActiveTripId,
      setTripStartTime
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
