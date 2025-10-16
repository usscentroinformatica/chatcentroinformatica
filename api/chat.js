// Serverless API para Vercel - Centro de Informática USS
// Versión simplificada sin Google Sheets - Solo Gemini AI

// Almacenamiento en memoria para sesiones (temporal)
const studentSessions = new Map();

// Configuración del contexto del Centro de Informática USS
const SYSTEM_CONTEXT = `
Eres un asistente virtual del Centro de Informática de la Universidad Señor de Sipán (USS) en Chiclayo, Perú.

INFORMACIÓN INSTITUCIONAL:
- Universidad: Universidad Señor de Sipán (USS)
- Área: Centro de Informática  
- Ubicación: Chiclayo, Perú
- Email: centrodeinformatica@uss.edu.pe
- Teléfono: 986 724 506

SERVICIOS QUE OFRECES:
1. **Constancias y Certificados:**
   - Constancia de Estudios
   - Constancia de Notas  
   - Constancia de Ranking
   - Certificado de Estudios
   - Costo: S/ 15.00 por documento
   - Tiempo: 3-5 días hábiles

2. **Horarios de Atención:**
   - Presencial: Lunes a Viernes 8:00 AM - 6:00 PM, Sábados 8:00 AM - 12:00 PM
   - Virtual: 24/7 través del chat
   - Email: Respuesta en 24-48 horas

3. **Información Académica:**
   - Matrícula y procesos académicos
   - Programas de Ingeniería de Sistemas
   - Cursos: Computación I, II, III
   - Modalidades de pago

PERSONALIDAD:
- Profesional y amigable
- Usa emojis apropiados
- Proporciona información específica y útil
- Siempre ofrece contactos para consultas complejas

RESPUESTAS:
- Sé específico sobre los servicios del Centro de Informática
- Menciona costos, tiempos y requisitos cuando sea relevante
- Para dudas complejas, deriva a los contactos oficiales
- Mantén un tono profesional pero cercano
`;

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }

    console.log('📩 Consulta recibida:', { sessionId, message: message.substring(0, 100) });

    // Verificar API key de Gemini
    if (!process.env.GEMINI_API_KEY) {
      console.log('❌ GEMINI_API_KEY no configurada');
      return res.status(500).json({ 
        error: 'API key no configurada',
        response: 'Lo siento, hay un problema de configuración. Contacta a centrodeinformatica@uss.edu.pe o llama al 986 724 506.'
      });
    }

    // Obtener historial de sesión
    let sessionHistory = studentSessions.get(sessionId) || [];
    
    // Agregar mensaje actual al historial
    sessionHistory.push({
      role: 'user',
      content: message
    });

    // Modelos a probar en orden
    const modelsToTry = [
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent',
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent',
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent'
    ];

    let botResponse = '';
    let lastError = null;
    for (const modelUrl of modelsToTry) {
      try {
        console.log(`🤖 Probando modelo: ${modelUrl}`);
        const response = await fetch(`${modelUrl}?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Contexto del sistema: ${SYSTEM_CONTEXT}\n\nHistorial de conversación:\n${sessionHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}\n\nResponde como asistente del Centro de Informática USS:`
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024,
            }
          })
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.log(`❌ Error de Gemini (${modelUrl}):`, response.status, errorData);
          lastError = `Error de Gemini API: ${response.status} - ${errorData}`;
          continue; // Prueba el siguiente modelo
        }

        const data = await response.json();
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
          botResponse = data.candidates[0].content.parts[0].text;
          console.log(`✅ Respuesta recibida del modelo: ${modelUrl}`);
          break; // Salir del ciclo si funciona
        } else {
          console.log(`❌ Respuesta inválida de Gemini (${modelUrl}):`, data);
          lastError = 'Respuesta inválida de Gemini';
        }
      } catch (geminiError) {
        console.log(`❌ Error al conectar con Gemini (${modelUrl}):`, geminiError.message);
        lastError = geminiError.message;
      }
    }

    if (!botResponse) {
      return res.status(500).json({
        error: lastError || 'No se pudo obtener respuesta de ningún modelo Gemini',
        response: 'Error temporal con el servicio de IA. Por favor intenta nuevamente o contacta al administrador.'
      });
    }

    // Agregar respuesta del bot al historial
    sessionHistory.push({
      role: 'assistant',
      content: botResponse
    });

    // Limitar historial a últimos 10 intercambios
    if (sessionHistory.length > 20) {
      sessionHistory = sessionHistory.slice(-20);
    }

    // Guardar historial actualizado
    studentSessions.set(sessionId, sessionHistory);

    console.log('✅ Respuesta enviada exitosamente');

    return res.status(200).json({ 
      response: botResponse,
      sessionId: sessionId
    });

  } catch (error) {
    console.error('❌ Error en el servidor:', error);
    
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      response: 'Lo siento, hubo un problema técnico. Por favor contacta a:\n📧 centrodeinformatica@uss.edu.pe\n📱 986 724 506'
    });
  }
}
