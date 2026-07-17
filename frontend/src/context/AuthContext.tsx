import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';

interface AuthContextType {
  user: User | null;
  organizerId: string | null;
  activeTripId: string | null;
  isLoading: boolean;
  setOrganizerId: (id: string | null) => void;
  setActiveTripId: (id: string | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  organizerId: null,
  activeTripId: null,
  isLoading: true,
  setOrganizerId: () => {},
  setActiveTripId: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organizerId, setOrganizerId] = useState<string | null>(null);
  const [activeTripId, setActiveTripIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load persisted state
    const loadState = async () => {
      try {
        const storedTripId = await AsyncStorage.getItem('activeTripId');
        if (storedTripId) setActiveTripIdState(storedTripId);
      } catch (e) {
        console.error('Failed to load state', e);
      }
    };
    loadState();

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      // We will set organizerId after the /sync API call in login/register components
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

  return (
    <AuthContext.Provider value={{ user, organizerId, activeTripId, isLoading, setOrganizerId, setActiveTripId }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
