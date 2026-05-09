import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDlV1LpYL2CAnfPhH8DTsxSfLt-En-ZeaQ",
  authDomain: "kunim-bar-pos.firebaseapp.com",
  projectId: "kunim-bar-pos",
  storageBucket: "kunim-bar-pos.firebasestorage.app",
  messagingSenderId: "429884639700",
  appId: "1:429884639700:web:9be1bf68ec33b13f82ae41",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
