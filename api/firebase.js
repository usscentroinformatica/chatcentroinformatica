// firebase.js
const admin = require('firebase-admin');

if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    // DEBUG: Imprime las vars para ver qué llega a runtime
    console.log('🔍 DEBUG - FIREBASE_PROJECT_ID:', projectId ? '[SET]' : 'MISSING');
    console.log('🔍 DEBUG - FIREBASE_CLIENT_EMAIL:', clientEmail ? '[SET]' : 'MISSING');
    console.log('🔍 DEBUG - FIREBASE_PRIVATE_KEY length:', privateKey ? privateKey.length : 'MISSING');

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(`Faltan env vars de Firebase. Project ID: ${projectId ? 'OK' : 'MISSING'}, Client Email: ${clientEmail ? 'OK' : 'MISSING'}, Private Key length: ${privateKey ? privateKey.length : 'MISSING'}`);
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    console.log('✅ Firebase Admin inicializado correctamente');
  } catch (error) {
    console.error('❌ Error inicializando Firebase Admin:', error.message);
    // No crashea; fallback para que el bot funcione sin DB
  }
}

const db = admin.firestore();
module.exports = db;
