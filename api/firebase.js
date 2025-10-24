// firebase.js
const admin = require('firebase-admin');

if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    // DEBUG logs
    console.log('🔍 DEBUG - FIREBASE_PROJECT_ID:', projectId ? '[SET]' : 'MISSING');
    console.log('🔍 DEBUG - FIREBASE_CLIENT_EMAIL:', clientEmail ? '[SET]' : 'MISSING');
    console.log('🔍 DEBUG - FIREBASE_PRIVATE_KEY length:', privateKey ? privateKey.length : 'MISSING');

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(`Faltan env vars. Project ID: ${projectId ? 'OK' : 'MISSING'}, Client Email: ${clientEmail ? 'OK' : 'MISSING'}, Private Key length: ${privateKey ? privateKey.length : 'MISSING'}`);
    }

    // Fix PEM: Reemplaza \\n por \n reales (maneja backslashes dobles si Vercel los escapa extra)
    privateKey = privateKey.replace(/\\\\n/g, '\n').replace(/\\n/g, '\n');
    console.log('🔍 DEBUG - Private Key after replace length:', privateKey.length);  // Debe ser ~1600 si agrega \n

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
    console.error('❌ Full error:', error);  // Más detalles
  }
}

const db = admin.firestore();
module.exports = db;
