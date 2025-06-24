// backend/firebase.js
import admin from 'firebase-admin';
import serviceAccount from './serviceAccountKey.json' assert { type: 'json' };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://guide-gen.firebaseio.com"
});

export const db = admin.firestore();