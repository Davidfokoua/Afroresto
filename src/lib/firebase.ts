import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, initializeFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

function getOrInitFirestore(): Firestore {
  const dbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? firebaseConfig.firestoreDatabaseId
    : undefined;

  try {
    return initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    }, dbId);
  } catch {
    try {
      return dbId ? getFirestore(app, dbId) : getFirestore(app);
    } catch (err) {
      console.warn('getFirestore fallback notice:', err);
      return getFirestore(app);
    }
  }
}

export const db: Firestore = getOrInitFirestore();

export const auth = getAuth(app);

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

export default app;
