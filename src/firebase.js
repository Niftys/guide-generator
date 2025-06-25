// firebase.js
import { initializeApp } from 'firebase/app';
import { 
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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

// Authentication functions
const signUp = (email, password) => 
  createUserWithEmailAndPassword(auth, email, password);

const logIn = (email, password) => 
  signInWithEmailAndPassword(auth, email, password);

const logOut = () => signOut(auth);

// Auth state change observer
const onAuthChange = (callback) => 
  onAuthStateChanged(auth, callback);

export { 
  auth,
  db,
  signUp,
  logIn,
  logOut,
  onAuthChange
};