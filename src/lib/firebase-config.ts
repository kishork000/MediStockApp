
import {initializeApp, getApp, getApps} from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: "medistock-manager-s729t",
  appId: "demo",
  storageBucket: "demo",
  apiKey: "demo",
  authDomain: "medistock-manager-s729t.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "1078125691458",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export {app, db, auth};
