// firebase.js - Actualizado para usar Firebase Admin SDK en servidor (Vercel/Node.js)
// Usa las variables de entorno de Vercel para el service account
const admin = require('firebase-admin');

// Inicializar solo si no está ya inicializado
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Reemplaza \\n por saltos de línea reales
    }),
    // Opcional: databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
  });
}

const db = admin.firestore();

module.exports = db;
