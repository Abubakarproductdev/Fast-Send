import React, { createContext, useContext, useState } from 'react';
import { useRouter } from 'expo-router';
import { Text, StyleSheet, View } from 'react-native';
import { NeoSheet } from '../components/ui/NeoSheet';
import { NeoField } from '../components/ui/NeoField';
import { NeoInput } from '../components/ui/NeoInput';
import { NeoButton } from '../components/ui/NeoButton';
import { useAuth } from './AuthContext';
import { api } from '../services/api';
import { getErrorMessage } from '../utils/errors';
import { useTheme } from '../theme/ThemeContext';

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
  const { colors } = useTheme();

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

  const styles = StyleSheet.create({
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
      paddingHorizontal: 20,
      paddingVertical: 12,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.35,
      shadowRadius: 0,
      elevation: 5,
      backgroundColor: colors.ink,
      borderColor: colors.ink,
    },
    toastText: {
      fontSize: 13,
      fontFamily: 'Nunito_800ExtraBold',
      textAlign: 'center',
      color: colors.cream,
    },
    errorText: {
      fontSize: 13,
      fontFamily: 'Nunito_800ExtraBold',
      color: colors.flame,
      marginBottom: 12,
    }
  });

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

        {error ? (
          <Text style={styles.errorText}>
            {error}
          </Text>
        ) : null}

        <View style={{ marginTop: 8, marginBottom: 14 }}>
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
