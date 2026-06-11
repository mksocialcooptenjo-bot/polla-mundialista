import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// REEMPLAZA ESTE OBJETO COMPLETO CON EL QUE TE DIO GOOGLE EN EL PASO 2:
const firebaseConfig = {
  apiKey: "AIzaSyCgOjfL5TyPhFujwfEOiUB7jwwJ21x7nME",
  authDomain: "polla-mundialista-2026-f01fd.firebaseapp.com",
  projectId: "polla-mundialista-2026-f01fd",
  storageBucket: "polla-mundialista-2026-f01fd.firebasestorage.app",
  messagingSenderId: "215877088149",
  appId: "1:215877088149:web:39416d848ff1f3ed913c9c"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar las herramientas para usarlas en las pantallas
export const db = getFirestore(app);
export const auth = getAuth(app);