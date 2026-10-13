// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAk9bbfS5ohKmAZipoS8NNFYp2ZXzfC8vY",
  authDomain: "sibi-game-app.firebaseapp.com",
  projectId: "sibi-game-app",
  storageBucket: "sibi-game-app.firebasestorage.app",
  messagingSenderId: "48377438090",
  appId: "1:48377438090:web:6ed951ed7316387558b273",
  measurementId: "G-BW7R73509B"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Ekspor Auth dan Firestore agar bisa diakses oleh App.tsx dan Login.tsx
export const auth = getAuth(app);
export const db = getFirestore(app);