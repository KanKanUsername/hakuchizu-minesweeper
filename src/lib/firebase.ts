import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

export const isRankingEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

// firebase/* is dynamically imported so it never enters any bundle chunk
// unless ranking is actually enabled AND a caller reaches this module's
// async functions (e.g. once RankingBoard is wired into App.tsx for Phase 2).
let appPromise: Promise<FirebaseApp> | null = null;

function getApp(): Promise<FirebaseApp> {
  if (!isRankingEnabled) {
    return Promise.reject(new Error('Firebase is not configured (VITE_FIREBASE_* env vars missing)'));
  }
  if (!appPromise) {
    appPromise = import('firebase/app').then(({ initializeApp }) => initializeApp(firebaseConfig));
  }
  return appPromise;
}

export async function getDb(): Promise<Firestore> {
  const [{ getFirestore }, app] = await Promise.all([import('firebase/firestore'), getApp()]);
  return getFirestore(app);
}

export async function ensureSignedIn(): Promise<string> {
  const [{ getAuth, signInAnonymously }, app] = await Promise.all([import('firebase/auth'), getApp()]);
  const auth = getAuth(app);
  if (auth.currentUser) {
    return auth.currentUser.uid;
  }
  const credential = await signInAnonymously(auth);
  return credential.user.uid;
}
