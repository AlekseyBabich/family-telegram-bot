import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  connectFirestoreEmulator,
  enableIndexedDbPersistence,
  getFirestore,
  type Firestore
} from 'firebase/firestore';

let appInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;
let persistenceInitialized = false;
let emulatorConnected = false;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FB_APP_ID
};

const createApp = () => {
  if (appInstance) {
    return appInstance;
  }

  appInstance = initializeApp(firebaseConfig);
  return appInstance;
};

const resolveEmulatorConfig = () => {
  const host = import.meta.env.VITE_FB_EMULATOR_HOST;
  const portValue = import.meta.env.VITE_FB_EMULATOR_PORT;

  if (!host || !portValue) {
    return null;
  }

  const port = Number(portValue);
  if (Number.isNaN(port)) {
    if (import.meta.env.DEV) {
      console.warn('[firebase] Invalid Firestore emulator port provided', portValue);
    }
    return null;
  }

  return { host, port } as const;
};

export const app = createApp();

export const db: Firestore = (() => {
  if (firestoreInstance) {
    return firestoreInstance;
  }

  const instance = getFirestore(app);
  const emulatorConfig = resolveEmulatorConfig();

  if (emulatorConfig && !emulatorConnected) {
    connectFirestoreEmulator(instance, emulatorConfig.host, emulatorConfig.port);
    emulatorConnected = true;
    if (import.meta.env.DEV) {
      console.info(
        `[firebase] Connected to Firestore emulator at ${emulatorConfig.host}:${emulatorConfig.port}`
      );
    }
  }

  firestoreInstance = instance;

  if (!persistenceInitialized && typeof window !== 'undefined') {
    persistenceInitialized = true;
    enableIndexedDbPersistence(instance).catch((error) => {
      const code = (error as { code?: string } | null)?.code;
      if (code === 'failed-precondition' || code === 'unimplemented') {
        if (import.meta.env.DEV) {
          console.warn('[firebase] IndexedDB persistence disabled', error);
        }
        return;
      }
      console.error('[firebase] Failed to enable IndexedDB persistence', error);
    });
  }

  return instance;
})();
