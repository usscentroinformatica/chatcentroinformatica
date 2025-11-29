// chat.js - Backend optimizado con sistema de botones y flujos
const fetch = require('node-fetch');
require('dotenv').config();
const { db, admin } = require('./firebase');

// Contenido del PDF (mantenido igual)
const pdfContent = `PROGRAMA COMPUTACION PARA EGRESADOS... [contenido completo]`;

// Configuración del contexto mejorado
const SYSTEM_CONTEXT = `Eres un asistente virtual del Centro de Informática USS. Tu objetivo es ayudar con el Programa de Computación para Egresados de manera conversacional y eficiente.

INFORMACIÓN DEL PROGRAMA:
- Dirigido a: Egresados pregrado USS hasta 2023-2 con pendiente acreditación en cursos de computación.
- Modalidad: 100% virtual (Aula USS: www.aulauss.edu.pe), autoaprendizaje, 24/7.
- Cursos disponibles:
  📚 Computación 1: Microsoft Word (Intermedio - Avanzado) - S/ 200
  📚 Computación 2: Microsoft Excel (Básico - Intermedio - Avanzado) - S/ 200
  📚 Computación 3: IBM SPSS y MS Project - S/ 200

PROCESO DE REGISTRO:
1. Ingresa al campus USS → Trámites → PROGRAMACION DE SERVICIOS
2. PROGRAMA DE COMPUTACIÓN PARA EGRESADOS USS → Programar
3. Realizar pago (S/ 200)
4. Enviar comprobante a: centrodeinformatica@uss.edu.pe

MÉTODOS DE PAGO:
- Campus Virtual: Tarjeta/QR (Visa/Mastercard)
- Yape: Servicios programables (código alumno)
- BCP App: Servicios Programables (refleja en 3-5 horas)
- Agente BCP: Cuenta 305-1552328-0-87 (refleja en 24h)

REGLAS DE CONVERSACIÓN:
1. Sé conversacional y amigable, no robótico
2. Personaliza según datos del estudiante
3. No repitas exactamente la misma respuesta
4. Usa emojis moderadamente para dar calidez
5. Si el usuario hace preguntas fuera del flujo de botones, responde naturalmente

CONTACTOS:
📧 centrodeinformatica@uss.edu.pe
📞 986 724 506
🔧 Soporte técnico: ciso.dti@uss.edu.pe / helpdesk1@uss.edu.pe
📋 Constancias: acempresariales@uss.edu.pe
📚 Cambios académicos: paccis@uss.edu.pe`;

// Función para cargar sesión desde Firestore
async function loadSession(sessionId) {
  try {
    const docRef = db.collection('chatSessions').doc(sessionId);
    const doc = await docRef.get();
    
    if (doc.exists) {
      console.log('✅ Sesión cargada:', sessionId);
      return doc.data();
    }
    
    console.log('📝 Nueva sesión:', sessionId);
    return {
      sessionId,
      userData: {},
      currentStep: 'inicial',
      conversationHistory: [],
      createdAt: new Date().toISOString(),
      lastUpdate: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error cargando sesión:', error);
    return {
      sessionId,
      userData: {},
      currentStep: 'inicial',
      conversationHistory: [],
      createdAt: new Date().toISOString(),
      lastUpdate: new Date().toISOString()
    };
  }
}

// Función para guardar sesión en Firestore
async function saveSession(sessionId, sessionData) {
  try {
    await db.collection('chatSessions').doc(sessionId).set({
      ...sessionData,
      lastUpdate: new Date().toISOString()
    }, { merge: true });
    
    console.log('✅ Sesión guardada:', sessionId);
    return true;
  } catch (error) {
    console.error('❌ Error guardando sesión:', error);
    return false;
  }
}

// Función para guardar estudiante en colección dedicada
async function saveStudent(userData) {
  if (!userData.correo) return false;
  
  try {
    const docId = userData.correo.toLowerCase().replace(/[@.]/g, '_');
    await db.collection('estudiantes').doc(docId).set({
      nombre: userData.nombre || 'No proporcionado',
      correo: userData.correo,
      telefono: userData.telefono || 'No proporcionado',
      ciclo: userData.ciclo || 'No proporcionado',
      cursoInteres: userData.cursoSeleccionado || 'No especificado',
      elegible: userData.elegible || false,
      fechaRegistro: admin.firestore.FieldValue.serverTimestamp(),
      ultimaActualizacion: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log('✅ Estudiante guardado:', docId);
    return true;
  } catch (error) {
    console.error('❌ Error guardando estudiante:', error);
    return false;
  }
}

// Función para guardar feedback
async function saveFeedback(sessionId, feedbackType, userData) {
  try {
    const docId = `${sessionId}_${Date.now()}`;
    await db.collection('feedbacks').doc(docId).set({
      sessionId,
      feedbackType,
      nombre: userData.nombre || 'Anónimo',
      correo: userData.correo || 'No proporcionado',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Feedback guardado: ${feedbackType}`);
    return true;
  } catch (error) {
    console.error('❌ Error guardando feedback:', error);
    return false;
  }
}

// Función para extraer información del mensaje
function extractInfo(message) {
  const info = {};
  
  // Extraer correo
  const emailRegex = /[a-zA-Z0-9._%+-]+@uss\.edu\.pe/i;
  const emailMatch = message.match(emailRegex);
  if (emailMatch) info.correo = emailMatch[0].toLowerCase();
  
  // Extraer teléfono
  const phoneRegex = /\b9\d{8}\b|\b[7-9]\d{8}\b/;
  const phoneMatch = message.match(phoneRegex);
  if (phoneMatch) info.telefono = phoneMatch[0];
  
  // Extraer ciclo
  const cicloRegex = /(?:20\d{2}[-\s]?[1-2])|(?:20\d{2}[01][1-2])/g;
  const cicloMatch = message.match(cicloRegex);
  if (cicloMatch && cicloMatch.length > 0) {
    let ciclo = cicloMatch[0].replace(/\s+|-/g, '');
    if (ciclo.length === 6) {
      const year = ciclo.substring(0, 4);
      const period = parseInt(ciclo.substring(4, 6), 10);
      ciclo = `${year}-${period}`;
    }
    info.ciclo = ciclo;
  }
  
  return info;
}

// Función para verificar elegibilidad
function checkElegibilidad(ciclo) {
  if (!ciclo) return true;
  
  try {
    let cicloNorm = ciclo;
    if (ciclo.length === 6) {
      cicloNorm = `${ciclo.substring(0, 4)}-${parseInt(ciclo.substring(4, 6), 10)}`;
    }
    
    const [year, period] = cicloNorm.split('-').map(p => parseInt(p, 10));
    return (year < 2023) || (year === 2023 && period <= 2);
  } catch (error) {
    console.error('❌ Error verificando elegibilidad:', error);
    return true;
  }
}

// Función principal para manejar consultas con IA
async function getAIResponse(message, sessionData) {
  const models = [
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
  ];
  
  // Preparar historial para contexto
  const history = sessionData.conversationHistory || [];
  const recentHistory = history.slice(-10); // Últimos 10 mensajes
  
  const historyText = recentHistory
    .map(h => `${h.role === 'user' ? 'Usuario' : 'Asistente'}: ${h.content}`)
    .join('\n');
  
  const contextualPrompt = `${SYSTEM_CONTEXT}

DATOS DEL USUARIO:
${sessionData.userData.nombre ? `Nombre: ${sessionData.userData.nombre}` : 'Nombre: No proporcionado'}
${sessionData.userData.correo ? `Correo: ${sessionData.userData.correo}` : 'Correo: No proporcionado'}
${sessionData.userData.telefono ? `Teléfono: ${sessionData.userData.telefono}` : 'Teléfono: No proporcionado'}
${sessionData.userData.elegible !== undefined ? `Elegible: ${sessionData.userData.elegible ? 'Sí' : 'No'}` : ''}
${sessionData.userData.cursoSeleccionado ? `Curso de interés: ${sessionData.userData.cursoSeleccionado}` : ''}

HISTORIAL RECIENTE:
${historyText}

MENSAJE ACTUAL DEL USUARIO: ${message}

IMPORTANTE: 
- Responde de manera natural y conversacional
- Si el usuario hace una pregunta específica, respóndela directamente
- No repitas información que ya le hayas dado antes
- Personaliza tu respuesta usando los datos disponibles
- Mantén tus respuestas concisas pero informativas (máximo 200 palabras)
- Si pregunta por proceso, métodos de pago, o información específica, sé claro y estructurado`;

  for (const model of models) {
    try {
      console.log(`🔄 Intentando con modelo: ${model}`);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: contextualPrompt }]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 500,
              topP: 0.9,
              topK: 40
            },
            safetySettings: [
              {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              }
            ]
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
          const text = data.candidates[0].content.parts[0].text.trim();
          if (text.length > 50) {
            console.log(`✅ Respuesta obtenida de ${model}`);
            return text;
          }
        }
      }
    } catch (error) {
      console.log(`❌ Error con ${model}:`, error.message);
    }
  }
  
  return null;
}

// Función para generar respuesta de fallback según contexto
function getFallbackResponse(message, userData) {
  const lowerMsg = message.toLowerCase();
  
  // Preguntas sobre proceso
  if (lowerMsg.includes('proceso') || lowerMsg.includes('inscri') || lowerMsg.includes('registr')) {
    return `📋 **PROCESO DE INSCRIPCIÓN**

1️⃣ Ingresa al Campus USS con tus credenciales
2️⃣ Ve a "Trámites"
3️⃣ Selecciona "PROGRAMACIÓN DE SERVICIOS"
4️⃣ Elige "PROGRAMA DE COMPUTACIÓN PARA EGRESADOS USS"
5️⃣ Haz clic en "Programar"
6️⃣ Realiza el pago de S/ 200
7️⃣ Envía el comprobante a: centrodeinformatica@uss.edu.pe

¿Necesitas información sobre los métodos de pago?`;
  }
  
  // Preguntas sobre pagos
  if (lowerMsg.includes('pago') || lowerMsg.includes('pagar') || lowerMsg.includes('cuanto cuesta')) {
    return `💳 **MÉTODOS DE PAGO** (S/ 200 por curso)

1. **Campus Virtual**: Tarjeta/QR (Visa/Mastercard)
2. **Yape**: Servicios programables + código de alumno
3. **BCP App**: Servicios Programables (3-5 horas)
4. **Agente BCP**: Cuenta 305-1552328-0-87 (24 horas)

¿Hay algo más en lo que pueda ayudarte?`;
  }
  
  // Preguntas sobre cursos
  if (lowerMsg.includes('curso') || lowerMsg.includes('computacion')) {
    return `📚 **CURSOS DISPONIBLES** (S/ 200 c/u)

**Computación 1**: Microsoft Word Intermedio-Avanzado
• Formato avanzado y estilos
• Plantillas profesionales
• Tablas de contenido

**Computación 2**: Microsoft Excel Básico-Avanzado
• Fórmulas y funciones
• Tablas dinámicas
• Análisis de datos

**Computación 3**: IBM SPSS y MS Project
• Análisis estadístico
• Gestión de proyectos

¿En cuál estás interesado${userData.nombre ? ', ' + userData.nombre : ''}?`;
  }
  
  // Respuesta genérica
  return `Hola${userData.nombre ? ' ' + userData.nombre : ''}. Estoy aquí para ayudarte con el Programa de Computación para Egresados USS.

Puedo ayudarte con:
• Información sobre los cursos
• Proceso de inscripción
• Métodos de pago
• Requisitos y elegibilidad

¿Qué te gustaría saber?

📧 centrodeinformatica@uss.edu.pe
📞 986 724 506`;
}

// Exportar función principal del chatbot
module.exports = async function handleChat(req, res) {
  try {
    console.log('📥 Solicitud recibida:', req.body);
    
    const { message, sessionId, userData: frontendUserData } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Se requiere un mensaje' });
    }
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Se requiere sessionId' });
    }
    
    // Cargar sesión existente o crear nueva
    let sessionData = await loadSession(sessionId);
    
    // Extraer información del mensaje
    const extractedInfo = extractInfo(message);
    
    // Combinar datos del frontend con los extraídos
    sessionData.userData = {
      ...sessionData.userData,
      ...frontendUserData,
      ...extractedInfo
    };
    
    // Verificar elegibilidad si hay ciclo
    if (sessionData.userData.ciclo) {
      sessionData.userData.elegible = checkElegibilidad(sessionData.userData.ciclo);
    }
    
    // Detectar feedback
    const lowerMsg = message.toLowerCase().trim();
    if (['sí', 'si', 'yes', 'ok'].some(w => lowerMsg === w)) {
      await saveFeedback(sessionId, 'positive', sessionData.userData);
    } else if (['no', 'nop', 'mal'].some(w => lowerMsg === w)) {
      await saveFeedback(sessionId, 'negative', sessionData.userData);
    }
    
    // Agregar mensaje al historial
    if (!sessionData.conversationHistory) {
      sessionData.conversationHistory = [];
    }
    
    sessionData.conversationHistory.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });
    
    // Obtener respuesta de la IA
    let botResponse = await getAIResponse(message, sessionData);
    
    // Si la IA falla, usar fallback
    if (!botResponse || botResponse.length < 50) {
      console.log('⚠️ Usando respuesta de fallback');
      botResponse = getFallbackResponse(message, sessionData.userData);
    }
    
    // Agregar respuesta al historial
    sessionData.conversationHistory.push({
      role: 'assistant',
      content: botResponse,
      timestamp: new Date().toISOString()
    });
    
    // Limitar historial a últimos 30 mensajes
    if (sessionData.conversationHistory.length > 30) {
      sessionData.conversationHistory = sessionData.conversationHistory.slice(-30);
    }
    
    // Guardar sesión actualizada
    await saveSession(sessionId, sessionData);
    
    // Guardar estudiante si tiene datos completos
    if (sessionData.userData.nombre && sessionData.userData.correo && !sessionData.userData.saved) {
      await saveStudent(sessionData.userData);
      sessionData.userData.saved = true;
      await saveSession(sessionId, sessionData);
    }
    
    console.log('✅ Respuesta enviada exitosamente');
    
    return res.status(200).json({
      response: botResponse,
      sessionId,
      userData: sessionData.userData,
      isEligible: sessionData.userData.elegible !== false
    });
    
  } catch (error) {
    console.error('❌ Error en el servidor:', error);
    
    const errorResponse = `Lo siento, estamos experimentando dificultades técnicas. 

Por favor contacta directamente:
📧 centrodeinformatica@uss.edu.pe
📞 986 724 506`;
    
    return res.status(500).json({
      error: 'Error interno del servidor',
      response: errorResponse
    });
  }
};
