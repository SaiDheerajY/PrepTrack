import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBm6crSSfCiI-__JJ-Hq87LEO-QEsQQt74",
  authDomain: "preptrack-6c8d9.firebaseapp.com",
  projectId: "preptrack-6c8d9",
  storageBucket: "preptrack-6c8d9.appspot.com",
  messagingSenderId: "670887496100",
  appId: "1:670887496100:web:a85306a15d970184689931"
};

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
// messaging removed for simplicity and reliability
