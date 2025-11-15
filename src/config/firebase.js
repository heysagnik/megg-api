import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

let firebaseApp = null;

export const initializeFirebase = () => {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountKey) {
      console.warn('FIREBASE_SERVICE_ACCOUNT_KEY not set. FCM features will be disabled.');
      return null;
    }

    // Parse service account JSON from environment variable
    const serviceAccount = JSON.parse(serviceAccountKey);

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    console.log('Firebase Admin SDK initialized successfully');
    return firebaseApp;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error.message);
    return null;
  }
};

export const getMessaging = () => {
  if (!firebaseApp) {
    initializeFirebase();
  }
  
  if (!firebaseApp) {
    throw new Error('Firebase is not initialized. Check FIREBASE_SERVICE_ACCOUNT_KEY.');
  }
  
  return admin.messaging();
};

// Initialize on import
initializeFirebase();
