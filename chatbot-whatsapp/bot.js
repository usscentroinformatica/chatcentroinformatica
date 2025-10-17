const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// URL de tu API backend (cámbiala por la real)
const API_URL = 'https://chatcentroinformatica.vercel.app/api/chat';  // ← Ajusta aquí (Vercel o http://localhost:5000/api/chat)

// Almacén simple para sessionIds (por número de WhatsApp)
const sessionMap = new Map();  // { from: sessionId }

const client = new Client({
    authStrategy: new LocalAuth()  // Guarda sesión para no reescanear QR siempre
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('🔄 Escanea el QR con WhatsApp (Ajustes > Dispositivos vinculados).');
});

client.on('ready', () => {
    console.log('✅ WhatsApp conectado! El bot usa tu API de Gemini para respuestas.');
});

client.on('message', async (msg) => {
    const from = msg.from;  // Número del usuario (ej: 51912345678@c.us)
    const text = msg.body.trim();

    // Ignora mensajes del bot mismo o vacíos
    if (msg.fromMe || !text) return;

    // Genera o usa sessionId basado en el número (para mantener estado en tu API)
    let sessionId = sessionMap.get(from);
    if (!sessionId) {
        sessionId = `whatsapp_${from.replace(/[^0-9]/g, '')}`;  // Ej: whatsapp_51912345678
        sessionMap.set(from, sessionId);
        console.log(`🆕 Nueva sesión para ${from}: ${sessionId}`);
    }

    console.log(`💬 Mensaje de ${from}: ${text.substring(0, 100)}`);

    try {
        // Llama a tu API backend
        const apiResponse = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: text,
                sessionId: sessionId
            })
        });

        if (!apiResponse.ok) {
            const errorData = await apiResponse.text();
            console.error(`❌ Error API (${apiResponse.status}):`, errorData);
            return msg.reply('¡Ups! Error temporal. Intenta de nuevo o contacta a centrodeinformatica@uss.edu.pe');
        }

        const data = await apiResponse.json();
        const botResponse = data.response || 'No pude procesar tu mensaje. ¿Puedes reformularlo?';

        // Envía la respuesta en WhatsApp
        await msg.reply(botResponse);
        console.log(`🤖 Respuesta enviada a ${from}: ${botResponse.substring(0, 50)}...`);

        // Log de datos extraídos (si tu API los devuelve)
        if (data.studentData) {
            console.log(`📊 Datos extraídos para ${from}:\n${JSON.stringify(data.studentData, null, 2)}`);
        }

        if (data.isEligible !== undefined) {
            console.log(`✅ Elegibilidad: ${data.isEligible ? 'Sí' : 'No'}`);
        }

    } catch (error) {
        console.error('❌ Error al llamar API:', error);
        msg.reply('Error de conexión. Por favor, contacta al 986 724 506 o centrodeinformatica@uss.edu.pe');
    }
});

client.initialize();