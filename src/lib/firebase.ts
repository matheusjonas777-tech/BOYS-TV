import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const finalConfig = {
  apiKey: ((import.meta as any).env?.VITE_FIREBASE_API_KEY) || firebaseConfig.apiKey || "",
  authDomain: ((import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN) || firebaseConfig.authDomain || "",
  projectId: ((import.meta as any).env?.VITE_FIREBASE_PROJECT_ID) || firebaseConfig.projectId || "",
  storageBucket: ((import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET) || firebaseConfig.storageBucket || "",
  messagingSenderId: ((import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID) || firebaseConfig.messagingSenderId || "",
  appId: ((import.meta as any).env?.VITE_FIREBASE_APP_ID) || firebaseConfig.appId || "",
  firestoreDatabaseId: ((import.meta as any).env?.VITE_FIREBASE_DATABASE_ID) || (firebaseConfig as any).firestoreDatabaseId || ""
};

// If config is missing, Firestore will be disabled and the app will rely on local storage.
const isInitialized = finalConfig.apiKey && finalConfig.apiKey.trim() !== "" && finalConfig.projectId && finalConfig.projectId.trim() !== "";

let app;
let db;
let auth;
let googleProvider;
let googleDriveProvider;

if (isInitialized) {
  app = initializeApp(finalConfig);
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  }, finalConfig.firestoreDatabaseId || undefined);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  googleDriveProvider = new GoogleAuthProvider();
  googleDriveProvider.addScope('https://www.googleapis.com/auth/drive');
} else {
  console.warn("Firebase configuration is missing or invalid. Firestore is disabled; relying on LocalStorage.");
  // Mock implementations to prevent runtime crashes
  app = {} as any;
  db = {} as any;
  auth = { currentUser: null } as any;
  googleProvider = {} as any;
  googleDriveProvider = { addScope: () => {} } as any;
}

export { app, db, auth, googleProvider, googleDriveProvider };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes('Quota') || msg.includes('permission') || msg.includes('Key') || msg.includes('not-valid') || msg.includes('unauthorized-domain')) {
    setFirestoreOperational(false);
  }
  const errInfo: FirestoreErrorInfo = {
    error: msg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export let isFirestoreOperational = true;

export function setFirestoreOperational(val: boolean) {
  isFirestoreOperational = val;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("firestore-status-changed"));
  }
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    setFirestoreOperational(false);
    const msg = error?.message || String(error);
    if (msg.includes('the client is offline') || msg.includes('Could not reach') || msg.includes('timeout') || msg.includes('Quota') || msg.includes('permission')) {
      console.warn("Please check your Firebase configuration. Falling back to cached/offline Firestore operations.");
    } else {
      console.warn("Connection test failed (non-blocking):", msg);
    }
  }
}
testConnection();

// In-memory token cache with localStorage fallback
let cachedAccessToken: string | null = localStorage.getItem("gdrive_access_token");

export const getCachedAccessToken = () => cachedAccessToken;
export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  if (token) {
    localStorage.setItem("gdrive_access_token", token);
  } else {
    localStorage.removeItem("gdrive_access_token");
  }
};

onAuthStateChanged(auth, (user) => {
  if (!user) {
    cachedAccessToken = null;
    localStorage.removeItem("gdrive_access_token");
  }
});

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    // Silent check for standard cancellations so they don't produce noisy console.error dumps
    const isCancelled = error?.code === "auth/popup-closed-by-user" || 
                        error?.code === "auth/cancelled-popup-request" ||
                        error?.message?.includes("popup-closed-by-user") ||
                        error?.message?.includes("cancelled-popup-request");
    
    if (!isCancelled) {
      console.error("Error signing in with Google:", error);
    } else {
      console.warn("Google authentication was aborted by user: ", error?.message || error);
    }
    throw error;
  }
};

export const signInWithGoogleDrive = async () => {
  try {
    const result = await signInWithPopup(auth, googleDriveProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      setCachedAccessToken(credential.accessToken);
    }
    return result.user;
  } catch (error: any) {
    console.error("Error signing in with Google Drive:", error);
    throw error;
  }
};
