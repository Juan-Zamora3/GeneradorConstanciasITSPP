// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // Importa Firebase Auth
import { getFirestore } from "firebase/firestore"; // Importa Firestore
import { getStorage } from "firebase/storage"; // Importa Firebase Storage

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA9wYfjjjjp6w8QhslmOu72idKolgsXXCo",
  authDomain: "proyectointeg-e37de.firebaseapp.com",
  projectId: "proyectointeg-e37de",
  storageBucket: "proyectointeg-e37de.appspot.com",
  messagingSenderId: "1073149596999",
  appId: "1:1073149596999:web:1c3753054380b74332a862",
  measurementId: "G-8QZ7R79ZLR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Inicializa Authentication, Firestore y Storage
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // Inicializa Firebase Storage

export { auth, db, storage }; // Exporta el almacenamiento para su uso