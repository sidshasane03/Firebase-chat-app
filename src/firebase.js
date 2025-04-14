import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBtLCYswZloSUtuPu2nqFZsSuwuElgIQrM",
    authDomain: "fir-chat-app-f1ebb.firebaseapp.com",
    projectId: "fir-chat-app-f1ebb",
    storageBucket: "fir-chat-app-f1ebb.firebasestorage.app",
    messagingSenderId: "863226011175",
    appId: "1:863226011175:web:1fe7e8e266c612d8607802",
    measurementId: "G-CGHH8WGC88"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);