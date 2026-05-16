import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const isMockMode = !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY === 'your_api_key';

let app: any;
export let auth: any;

if (!isMockMode) {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
}

let mockUser: any = null;

export const loginAnonymously = async () => {
  if (isMockMode) {
    mockUser = { uid: 'mock-guest-123', getIdToken: async () => 'dev-token-mock-guest-123' };
    return mockUser;
  }
  const result = await signInAnonymously(auth);
  return result.user;
};

export const loginWithGoogle = async () => {
  if (isMockMode) {
    mockUser = { uid: 'mock-google-123', email: 'google@mock.com', getIdToken: async () => 'dev-token-mock-google-123' };
    return mockUser;
  }
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
};

export const getToken = async (forceRefresh = false) => {
  if (isMockMode) return mockUser ? await mockUser.getIdToken() : null;
  return auth.currentUser?.getIdToken(forceRefresh);
};

export const onAuth = (callback: (user: any) => void) => {
  if (isMockMode) {
    setTimeout(() => callback(mockUser), 100);
    return () => {};
  }
  return auth.onAuthStateChanged(callback);
};
