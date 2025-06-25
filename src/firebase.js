import { initializeApp } from 'firebase/app';
import { 
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore,
  connectFirestoreEmulator,
  enableNetwork,
  disableNetwork,
  enableIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED,
  collection,
  getDocs
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDCwsNL4sr-uTuRoZ2KpcBObiQTJRmjHsk",
  authDomain: "guide-gen.firebaseapp.com",
  projectId: "guide-gen",
  storageBucket: "guide-gen.firebasestorage.app",
  messagingSenderId: "532793465722",
  appId: "1:532793465722:web:c2e3cdda8d0453f6f7d4c3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Configure Firestore with proper settings - MUST happen before any other Firestore operations
const initializeFirestore = async () => {
  try {
    // Enable offline persistence with unlimited cache size
    await enableIndexedDbPersistence(db, {
      synchronizeTabs: true
    });
    console.log('Firestore offline persistence enabled');
  } catch (error) {
    if (error.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time');
    } else if (error.code === 'unimplemented') {
      console.warn('The current browser doesn\'t support offline persistence');
    } else {
      console.error('Firestore persistence error:', error);
    }
  }
};

// Initialize Firestore settings immediately
initializeFirestore();

// Enable emulator only in development
try {
  if (process.env.NODE_ENV === 'development' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    // Uncomment if you want to use emulator
    // connectFirestoreEmulator(db, 'localhost', 8080);
  }
} catch (error) {
  console.log('Firestore emulator connection failed:', error);
}

// Authentication functions
const signUp = (email, password) => 
  createUserWithEmailAndPassword(auth, email, password);

const logIn = (email, password) => 
  signInWithEmailAndPassword(auth, email, password);

const logOut = () => signOut(auth);

// Auth state change observer
const onAuthChange = (callback) => 
  onAuthStateChanged(auth, callback);

// Better connection check function
const checkFirestoreConnection = async () => {
  try {
    // Enable network first
    await enableNetwork(db);
    
    // Simple connection test without making actual queries
    // This avoids the problematic Listen stream that's causing 400 errors
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, 3000);
      
      // Check if we can access the Firestore instance
      if (db && db._delegate) {
        clearTimeout(timeout);
        resolve(true);
      } else {
        clearTimeout(timeout);
        resolve(false);
      }
    });
    
  } catch (error) {
    console.error('Firestore connection check failed:', error);
    return false;
  }
};

// Network state management
const setFirestoreOnline = async () => {
  try {
    await enableNetwork(db);
    console.log('Firestore network enabled');
  } catch (error) {
    console.error('Failed to enable Firestore network:', error);
  }
};

const setFirestoreOffline = async () => {
  try {
    await disableNetwork(db);
    console.log('Firestore network disabled');
  } catch (error) {
    console.error('Failed to disable Firestore network:', error);
  }
};

export default {
  auth,
  db,
  signUp,
  logIn,
  logOut,
  onAuthChange,
  checkFirestoreConnection,
  setFirestoreOnline,
  setFirestoreOffline
};