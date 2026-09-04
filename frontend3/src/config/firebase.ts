import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getReactNativePersistence } from './firebasePersistence';

const firebaseConfig = {
  apiKey: "AIzaSyDh9naw5yWwt6kYlBPd-CHQ7rk6P0tEBlk",
  authDomain: "fastsend-6e4e9.firebaseapp.com",
  projectId: "fastsend-6e4e9",
  storageBucket: "fastsend-6e4e9.firebasestorage.app",
  messagingSenderId: "98382858258",
  appId: "1:98382858258:web:0f6370d0e8be14b927b0cb",
  measurementId: "G-FMWDWV42DD"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = Platform.OS === 'web'
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
