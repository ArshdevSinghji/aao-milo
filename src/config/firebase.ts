import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAmxejnWMcvHAwktBDMHutUiNo_qgP5yx4",
  authDomain: "aao-milo.firebaseapp.com",
  projectId: "aao-milo",
  storageBucket: "aao-milo.firebasestorage.app",
  messagingSenderId: "549083015779",
  appId: "1:549083015779:web:ed05c3c3ed4886d0dda656",
  measurementId: "G-BF92W1SEYW",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth();
