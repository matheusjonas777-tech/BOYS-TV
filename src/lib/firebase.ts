import { initializeApp } from 'firebase/app';
import {
  getAuth as realGetAuth,
  GoogleAuthProvider,
  signInWithPopup as realSignInWithPopup,
  onAuthStateChanged as realOnAuthStateChanged,
  signOut as realSignOut,
  createUserWithEmailAndPassword as realCreateUserWithEmailAndPassword,
  signInWithEmailAndPassword as realSignInWithEmailAndPassword,
  sendPasswordResetEmail as realSendPasswordResetEmail,
} from 'firebase/auth';
import {
  initializeFirestore,
  doc as realDoc,
  getDocFromServer as realGetDocFromServer,
  collection as realCollection,
  query as realQuery,
  where as realWhere,
  orderBy as realOrderBy,
  limit as realLimit,
  onSnapshot as realOnSnapshot,
  setDoc as realSetDoc,
  getDoc as realGetDoc,
  getDocs as realGetDocs,
  updateDoc as realUpdateDoc,
  deleteDoc as realDeleteDoc,
  addDoc as realAddDoc,
  serverTimestamp as realServerTimestamp,
  arrayUnion as realArrayUnion,
  arrayRemove as realArrayRemove,
  deleteField as realDeleteField,
} from 'firebase/firestore';
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
let isInitialized = !!(finalConfig.apiKey && finalConfig.apiKey.trim() !== "" && finalConfig.projectId && finalConfig.projectId.trim() !== "");

export let isFirestoreOperational = true;

let app: any;
let db: any;
let auth: any;
let googleProvider: any;
let googleDriveProvider: any;

function setupMockFirebase() {
  console.warn("Firebase configuration is missing, invalid or failed to initialize. Firestore is disabled; relying on LocalStorage.");
  isInitialized = false;
  isFirestoreOperational = false;
  app = {} as any;
  db = {} as any;
  auth = {
    currentUser: null,
  } as any;
  googleProvider = {} as any;
  googleDriveProvider = { addScope: () => {} } as any;
}

if (isInitialized) {
  try {
    app = initializeApp(finalConfig);
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
    }, finalConfig.firestoreDatabaseId || undefined);
    auth = realGetAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleDriveProvider = new GoogleAuthProvider();
    googleDriveProvider.addScope('https://www.googleapis.com/auth/drive');
  } catch (err: any) {
    console.warn("Firebase SDK failed to initialize correctly because of an invalid API Key or active block. Utilizing complete LocalStorage redundancy:", err);
    setupMockFirebase();
  }
} else {
  setupMockFirebase();
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
      providerInfo: auth.currentUser?.providerData?.map((provider: any) => ({
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


export function setFirestoreOperational(val: boolean) {
  isFirestoreOperational = val;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("firestore-status-changed"));
  }
}

async function testConnection() {
  if (!isInitialized || !db || typeof db.app === 'undefined') {
    setFirestoreOperational(false);
    return;
  }
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

// Safe registration of onAuthStateChanged depending on firebase status
if (isInitialized && auth && typeof auth.app !== 'undefined') {
  realOnAuthStateChanged(auth, (user) => {
    if (!user) {
      cachedAccessToken = null;
      localStorage.removeItem("gdrive_access_token");
    }
  });
}

export const signInWithGoogle = async () => {
  if (!isInitialized || !auth || typeof auth.app === 'undefined') {
    throw new Error("O Firebase não foi inicializado de forma correta devido a chaves incompatíveis ou erros de rede. Por favor, conecte a sua conta administrativa offline utilizando a senha 123456 no console de administração.");
  }
  try {
    const result = await realSignInWithPopup(auth, googleProvider);
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
  if (!isInitialized || !auth || typeof auth.app === 'undefined') {
    throw new Error("O Firebase não foi inicializado de forma correta e o Google Drive está offline.");
  }
  try {
    const result = await realSignInWithPopup(auth, googleDriveProvider);
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

// --- SAFE WRAPPERS REDIRECT FROM FIREBASE SDKs ---

export function doc(dbInstance: any, ...args: any[]) {
  if (!isInitialized || !dbInstance || typeof dbInstance.app === 'undefined') {
    return {
      _key: { path: { segments: args } },
      id: args[args.length - 1],
      type: "document",
      mock: true
    } as any;
  }
  return (realDoc as any)(dbInstance, ...args);
}

export function collection(dbInstance: any, ...args: any[]) {
  if (!isInitialized || !dbInstance || typeof dbInstance.app === 'undefined') {
    return {
      id: args[args.length - 1],
      type: "collection",
      mock: true
    } as any;
  }
  return (realCollection as any)(dbInstance, ...args);
}

export function query(queryInstance: any, ...args: any[]) {
  if (!isInitialized || !queryInstance || queryInstance.mock) {
    return { ...queryInstance, mock: true } as any;
  }
  return (realQuery as any)(queryInstance, ...args);
}

export function where(...args: any[]) {
  if (!isInitialized) return { type: "where", args, mock: true } as any;
  return (realWhere as any)(...args);
}

export function orderBy(...args: any[]) {
  if (!isInitialized) return { type: "orderBy", args, mock: true } as any;
  return (realOrderBy as any)(...args);
}

export function limit(...args: any[]) {
  if (!isInitialized) return { type: "limit", args, mock: true } as any;
  return (realLimit as any)(...args);
}

export function deleteField() {
  if (!isInitialized) return "__DELETE_FIELD__" as any;
  return realDeleteField();
}

export function serverTimestamp() {
  if (!isInitialized) return Date.now() as any;
  return realServerTimestamp();
}

export function arrayUnion(...args: any[]) {
  if (!isInitialized) return { type: "arrayUnion", args, mock: true } as any;
  return (realArrayUnion as any)(...args);
}

export function arrayRemove(...args: any[]) {
  if (!isInitialized) return { type: "arrayRemove", args, mock: true } as any;
  return (realArrayRemove as any)(...args);
}

export function onSnapshot(ref: any, onNext: any, onError?: any) {
  if (!isInitialized || !ref || ref.mock) {
    return () => {};
  }
  return realOnSnapshot(ref, onNext, onError);
}

export function getDoc(ref: any) {
  if (!isInitialized || !ref || ref.mock) {
    return Promise.resolve({
      exists: () => false,
      data: () => undefined,
      id: ref?.id || "mock_id"
    } as any);
  }
  return realGetDoc(ref);
}

export function getDocs(refOrQuery: any) {
  if (!isInitialized || !refOrQuery || refOrQuery.mock) {
    return Promise.resolve({
      empty: true,
      docs: []
    } as any);
  }
  return realGetDocs(refOrQuery);
}

export function setDoc(ref: any, data: any, options?: any) {
  if (!isInitialized || !ref || ref.mock) {
    return Promise.resolve();
  }
  return realSetDoc(ref, data, options);
}

export function updateDoc(ref: any, data: any) {
  if (!isInitialized || !ref || ref.mock) {
    return Promise.resolve();
  }
  return realUpdateDoc(ref, data);
}

export function deleteDoc(ref: any) {
  if (!isInitialized || !ref || ref.mock) {
    return Promise.resolve();
  }
  return realDeleteDoc(ref);
}

export function addDoc(coll: any, data: any) {
  if (!isInitialized || !coll || coll.mock) {
    return Promise.resolve({
      id: "mock_added_id_" + Math.random().toString(36).substring(2, 9),
      mock: true
    } as any);
  }
  return realAddDoc(coll, data);
}

export function getDocFromServer(ref: any) {
  if (!isInitialized || !ref || ref.mock) {
    return Promise.reject(new Error("Firebase is offline."));
  }
  return realGetDocFromServer(ref);
}

export function onAuthStateChanged(authInstance: any, next: any, error?: any) {
  if (!isInitialized || !authInstance || typeof authInstance.app === 'undefined') {
    setTimeout(() => next(null), 50);
    return () => {};
  }
  return realOnAuthStateChanged(authInstance, next, error);
}

export function signOut(authInstance: any) {
  if (!isInitialized || !authInstance || typeof authInstance.app === 'undefined') {
    return Promise.resolve();
  }
  return realSignOut(authInstance);
}

export function createUserWithEmailAndPassword(authInstance: any, email: string, pass: string) {
  if (!isInitialized || !authInstance || typeof authInstance.app === 'undefined') {
    return Promise.reject(new Error("O Firebase não foi inicializado de forma correta devido a chaves incompatíveis ou erros de rede."));
  }
  return realCreateUserWithEmailAndPassword(authInstance, email, pass);
}

export function signInWithEmailAndPassword(authInstance: any, email: string, pass: string) {
  if (!isInitialized || !authInstance || typeof authInstance.app === 'undefined') {
    return Promise.reject(new Error("O Firebase não foi inicializado de forma correta devido a chaves incompatíveis ou erros de rede."));
  }
  return realSignInWithEmailAndPassword(authInstance, email, pass);
}

export function sendPasswordResetEmail(authInstance: any, email: string) {
  if (!isInitialized || !authInstance || typeof authInstance.app === 'undefined') {
    return Promise.reject(new Error("O Firebase não foi inicializado de forma correta devido a chaves incompatíveis ou erros de rede."));
  }
  return realSendPasswordResetEmail(authInstance, email);
}
