// Firebase Admin SDK para Node.js
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Configuración de credenciales (usa variables de entorno o archivo de clave si lo tienes)
// Firebase SDK para Web (compatible con Vercel)
const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');

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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

module.exports = db;
