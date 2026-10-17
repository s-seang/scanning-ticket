import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/** True when .env holds a real project, so the UI can explain itself if not. */
export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId);

export const app = initializeApp(
  isFirebaseConfigured ? config : { apiKey: 'missing', projectId: 'missing', appId: 'missing' },
);

export const auth = getAuth(app);

/*
 * Persistent cache keeps attendee lists readable when the venue wifi drops and
 * lets several scanning laptops share one event without re-fetching everything.
 */
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
