import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  enableIndexedDbPersistence,
  getFirestore,
  type Firestore
} from 'firebase/firestore';

let appInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;

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

export const app = createApp();

export const db: Firestore = (() => {
  if (firestoreInstance) {
    return firestoreInstance;
  }

  const instance = getFirestore(app);
  firestoreInstance = instance;

  if (typeof window !== 'undefined') {
    enableIndexedDbPersistence(instance).catch((error) => {
      if (import.meta.env.DEV) {
        console.warn('[firebase] IndexedDB persistence unavailable', error);
      }
    });
  }

  return instance;
})();
