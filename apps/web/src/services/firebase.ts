import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = window.__FIREBASE_CONFIG__;

if (!firebaseConfig) {
  throw new Error('Firebase config is missing. Проверьте window.__FIREBASE_CONFIG__ в index.html.');
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
