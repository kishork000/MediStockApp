
import {initializeApp, getApp, getApps} from 'firebase/app';

const firebaseConfig = {
  projectId: "medistock-manager-s729t",
  appId: "1:1078125691458:web:0c84d0d68b64c3816623db",
  storageBucket: "medistock-manager-s729t.firebasestorage.app",
  apiKey: "AIzaSyCZysJi4N6BK7a59gmZDWjA3sdmp1PRbuA",
  authDomain: "medistock-manager-s729t.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "1078125691458",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export {app};
