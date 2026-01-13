import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App;
let adminAuth: Auth;
let adminDb: Firestore;

// Initialize Firebase Admin (server-side only)
const initAdmin = () => {
  if (getApps().length === 0) {
    // In production, use service account credentials from environment
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    if (!privateKey || !process.env.FIREBASE_ADMIN_PROJECT_ID || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
      throw new Error('Firebase Admin credentials not configured');
    }

    app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
  } else {
    app = getApps()[0];
  }

  adminAuth = getAuth(app);
  adminDb = getFirestore(app);

  return { app, adminAuth, adminDb };
};

// Lazy initialization
export const getAdminAuth = (): Auth => {
  if (!adminAuth) {
    initAdmin();
  }
  return adminAuth;
};

export const getAdminDb = (): Firestore => {
  if (!adminDb) {
    initAdmin();
  }
  return adminDb;
};

// Verify Firebase ID token
export const verifyIdToken = async (token: string) => {
  const auth = getAdminAuth();
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    throw error;
  }
};

// Get user by Firebase UID
export const getUserByUid = async (uid: string) => {
  const auth = getAdminAuth();
  try {
    return await auth.getUser(uid);
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};
