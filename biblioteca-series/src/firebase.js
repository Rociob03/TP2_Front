// ============================================================
// CONEXIÓN CON FIREBASE
// Acá se inicializa Firebase con los datos del archivo .env (variables VITE_...)
// y se exportan los dos servicios que usa la app:
//   - db:   Cloud Firestore (la base de datos)
//   - auth: Authentication (email, Google e invitado)
// Los permisos de lectura y escritura están en firestore.rules (se publican en Firebase).
// ============================================================
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
