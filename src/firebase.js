import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
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

export const auth = getAuth(app);
export const db = getFirestore(app);
