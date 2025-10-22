// Firebase Admin SDK para Node.js
const { initializeApp, cert } = require('firebase-admin/app');  // Cambia: usa 'cert' en lugar de 'applicationDefault'
const { getFirestore } = require('firebase-admin/firestore');

// Ruta al archivo de service account (ajusta si es necesario)
const serviceAccount = require('./egresadoschat-firebase-adminsdk-fbsvc-c236c2843f.json');  // ¡Agrega esta línea!

const firebaseConfig = {
  apiKey: "AIzaSyBtP-1r5wPWwsmuOuLoMXO9PyGvYxXGStA",
  authDomain: "egresadoschat.firebaseapp.com",
  projectId: "egresadoschat",
  storageBucket: "egresadoschat.firebasestorage.app",
  messagingSenderId: "455022690021",
  appId: "1:455022690021:web:f7a0b4d19ec9dda38a5e0c",
  measurementId: "G-KE04QHM6XT"
};

// Inicializa con service account (reemplaza credential: applicationDefault())
initializeApp({
  credential: cert(serviceAccount),  // ¡Esto es lo clave!
  ...firebaseConfig
});

const db = getFirestore();

module.exports = db;