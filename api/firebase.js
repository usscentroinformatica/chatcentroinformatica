// Firebase Admin SDK para Node.js
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Configuración de credenciales (usa variables de entorno o archivo de clave si lo tienes)
const firebaseConfig = {
  apiKey: "AIzaSyBtP-1r5wPWwsmuOuLoMXO9PyGvYxXGStA",
  authDomain: "egresadoschat.firebaseapp.com",
  projectId: "egresadoschat",
  storageBucket: "egresadoschat.firebasestorage.app",
  messagingSenderId: "455022690021",
  appId: "1:455022690021:web:f7a0b4d19ec9dda38a5e0c",
  measurementId: "G-KE04QHM6XT"
};

// Inicializar Firebase Admin
initializeApp({
  credential: applicationDefault(),
  ...firebaseConfig
});

const db = getFirestore();

module.exports = db;
