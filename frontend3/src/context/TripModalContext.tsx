import React, { createContext, useContext, useState } from 'react';
import { useRouter } from 'expo-router';
import { NeoSheet } from '../components/ui/NeoSheet';
import { NeoField } from '../components/ui/NeoField';
import { NeoInput } from '../components/ui/NeoInput';
import { NeoButton } from '../components/ui/NeoButton';
import { useAuth } from './AuthContext';
import { api } from '../services/api';
import { getErrorMessage } from '../utils/errors';
import { Text, StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';

interface TripModalContextType {
  openCreateTrip: () => void;
  closeCreateTrip: () => void;
  showToast: (msg: string) => void;
}

const TripModalContext = createContext<TripModalContextType>({
  openCreateTrip: () => {},
  closeCreateTrip: () => {},
  showToast: () => {},
});

export const TripModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const { organizerId, setActiveTripId, setTripStartTime } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [tripName, setTripName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const openCreateTrip = () => {
    setTripName('');
    setError('');
    setIsOpen(true);
  };

  const closeCreateTrip = () => {
    if (busy) return;
    setIsOpen(false);
    setError('');
  };

  const handleCreateTrip = async () => {
    const name = tripName.trim();
    if (!name) {
      setError('Give your trip a name first.');
      return;
    }
    if (!organizerId) {
      setError('Still connecting your account — try again in a moment.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const created = await api.createTrip(organizerId, name);
      await setActiveTripId(created.id);
      await setTripStartTime(new Date().toISOString());
      setIsOpen(false);
      setTripName('');
      showToast(`Trip "${created.name}" is live!`);
      router.push(`/trip-details?tripId=${created.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <TripModalContext.Provider value={{ openCreateTrip, closeCreateTrip, showToast }}>
      {children}

      <NeoSheet
        open={isOpen}
        onClose={closeCreateTrip}
        title="Create a new trip"
        subtitle="Give your trip a name and start collecting moments."
      >
        <NeoField label="Trip name">
          <NeoInput
            value={tripName}
            onChangeText={(t) => {
              setTripName(t);
              setError('');
            }}
            placeholder="e.g. Ahmed's Wedding, Summer Trip"
            autoFocus
          />
        </NeoField>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.btnWrap}>
          <NeoButton
            title={busy ? 'Creating…' : 'Create a new trip'}
            onPress={handleCreateTrip}
            loading={busy}
            size="lg"
          />
        </View>
      </NeoSheet>

      {toastMsg ? (
        <View pointerEvents="none" style={styles.toastWrap}>
          <View style={styles.toastBox}>
            <Text style={styles.toastText}>{toastMsg}</Text>
          </View>
        </View>
      ) : null}
    </TripModalContext.Provider>
  );
};

export const useTripModal = () => useContext(TripModalContext);

const styles = StyleSheet.create({
  errorText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.flame,
    marginBottom: 12,
  },
  btnWrap: {
    marginTop: 8,
    marginBottom: 14,
  },
  toastWrap: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 95,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastBox: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.ink,
    paddingHorizontal: 18,
    paddingVertical: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 0,
    elevation: 5,
  },
  toastText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.cream,
    textAlign: 'center',
  },
});
