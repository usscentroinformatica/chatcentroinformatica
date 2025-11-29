// chat.js - Backend optimizado con sistema de botones y flujos
const fetch = require('node-fetch');
require('dotenv').config();
const { db, admin } = require('./firebase');

// Contenido del PDF (mantenido igual)
const pdfContent = `PROGRAMA COMPUTACION PARA EGRESADOS... [contenido completo]`;

// Configuración del contexto mejorado
const SYSTEM_CONTEXT = `Eres un asistente virtual amigable y conversacional del Centro de Informática USS. Ayudas con el Programa de Computación para Egresados.

IMPORTANTE - REGLAS DE CONVERSACIÓN:
1. NO pidas datos personales (nombre, correo, teléfono) a menos que sea absolutamente necesario
2. Responde directamente a la pregunta del usuario de manera natural
3. Sé conciso pero informativo (máximo 150 palabras)
4. Usa emojis moderadamente para dar calidez
5. Si el usuario hace una pregunta específica, ve directo al punto
6. NO uses formatos de listas largas ni bullet points excesivos

INFORMACIÓN DEL PROGRAMA:
- Dirigido a: Egresados pregrado USS hasta 2023-2 con pendiente acreditación en cursos de computación
- Modalidad: 100% virtual (Aula USS: www.aulauss.edu.pe), autoaprendizaje, 24/7
- Cursos disponibles:
  📚 Computación 1: Microsoft Word (Intermedio - Avanzado) - S/ 200
  📚 Computación 2: Microsoft Excel (Básico - Intermedio - Avanzado) - S/ 200
  📚 Computación 3: IBM SPSS y MS Project - S/ 200

PROCESO DE INSCRIPCIÓN (solo mencionar si preguntan):
1. Campus USS → Trámites → PROGRAMACIÓN DE SERVICIOS
2. PROGRAMA DE COMPUTACIÓN PARA EGRESADOS USS → Programar
3. Pagar S/ 200
4. Enviar comprobante a: centrodeinformatica@uss.edu.pe

MÉTODOS DE PAGO (solo mencionar si preguntan):
- Campus Virtual: Tarjeta/QR (Visa/Mastercard)
- Yape: Servicios programables (código alumno)
- BCP App: Servicios Programables (3-5 horas)
- Agente BCP: Cuenta 305-1552328-0-87 (24h)

CONTACTOS (solo mencionar si preguntan):
📧 centrodeinformatica@uss.edu.pe
📞 986 724 506

EJEMPLOS DE RESPUESTAS NATURALES:
Pregunta: "¿Cuánto cuesta?"
Respuesta: "Cada curso cuesta S/ 200. Son 3 cursos en total: Computación 1 (Word), Computación 2 (Excel) y Computación 3 (SPSS y MS Project). ¿Te interesa alguno en específico?"

Pregunta: "¿Cómo me inscribo?"
Respuesta: "Es sencillo: entras al Campus USS, vas a Trámites > Programación de Servicios > seleccionas el Programa de Computación para Egresados, lo programas y pagas S/ 200. Luego envías el comprobante a centrodeinformatica@uss.edu.pe. ¿Necesitas ayuda con algún paso?"

Pregunta: "¿Qué aprendo en Computación 1?"
Respuesta: "En Computación 1 aprendes Microsoft Word a nivel intermedio-avanzado: formato avanzado, estilos y plantillas profesionales, tablas de contenido, control de cambios y trabajo colaborativo. Es 100% virtual y a tu ritmo. ¿Quieres saber más detalles?"`;


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
  
  // Preparar historial para contexto (solo últimos 6 mensajes para mantener respuestas concisas)
  const history = sessionData.conversationHistory || [];
  const recentHistory = history.slice(-6);
  
  const historyText = recentHistory
    .map(h => `${h.role === 'user' ? 'Usuario' : 'Asistente'}: ${h.content}`)
    .join('\n');
  
  const contextualPrompt = `${SYSTEM_CONTEXT}

HISTORIAL RECIENTE:
${historyText || 'Sin historial previo'}

MENSAJE DEL USUARIO: ${message}

IMPORTANTE: 
- NO pidas datos personales innecesariamente
- Responde DIRECTAMENTE a la pregunta en máximo 150 palabras
- Sé conversacional y natural, como un humano
- NO uses listas largas ni formatos complejos
- Si preguntan algo específico, ve al grano sin rodeos`;

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
              temperature: 0.8,
              maxOutputTokens: 400,
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
          
          // Verificar que la respuesta sea útil (no muy corta ni muy larga)
          if (text.length > 30 && text.length < 800) {
            console.log(`✅ Respuesta obtenida de ${model} (${text.length} caracteres)`);
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
  
  // Saludos
  if (['hola', 'buenos días', 'buenas tardes', 'buenas noches', 'hey', 'hi'].some(s => lowerMsg.includes(s))) {
    return `¡Hola! 😊 Soy tu asistente del Centro de Informática USS. Estoy aquí para ayudarte con el Programa de Computación para Egresados. ¿En qué puedo ayudarte?`;
  }
  
  // Preguntas sobre costo
  if (lowerMsg.includes('cuanto cuesta') || lowerMsg.includes('precio') || lowerMsg.includes('costo')) {
    return `Cada curso cuesta S/ 200. Son 3 cursos disponibles:

📚 Computación 1 (Word) - S/ 200
📚 Computación 2 (Excel) - S/ 200  
📚 Computación 3 (SPSS/MS Project) - S/ 200

Todos son 100% virtuales con acceso 24/7. ¿Te interesa alguno en específico?`;
  }
  
  // Preguntas sobre proceso/inscripción
  if (lowerMsg.includes('proceso') || lowerMsg.includes('inscri') || lowerMsg.includes('registr') || lowerMsg.includes('matricul')) {
    return `Para inscribirte es muy sencillo:

1. Entra al Campus USS con tus credenciales
2. Ve a Trámites > Programación de Servicios
3. Selecciona "Programa de Computación para Egresados USS"
4. Programa el curso que deseas
5. Paga S/ 200 por tu método preferido
6. Envía tu comprobante a centrodeinformatica@uss.edu.pe

¿Necesitas ayuda con algún paso en particular?`;
  }
  
  // Preguntas sobre pagos
  if (lowerMsg.includes('pago') || lowerMsg.includes('pagar') || lowerMsg.includes('yape') || lowerMsg.includes('bcp')) {
    return `Puedes pagar de 4 formas:

💳 Campus Virtual: Con tarjeta o QR (Visa/Mastercard)
📱 Yape: En servicios programables con tu código de alumno
🏦 App BCP: En "Servicios Programables" (se refleja en 3-5 horas)
🏪 Agente BCP: Cuenta 305-1552328-0-87 (se refleja en 24 horas)

¿Tienes alguna preferencia de pago?`;
  }
  
  // Preguntas sobre cursos en general
  if ((lowerMsg.includes('curso') || lowerMsg.includes('computacion')) && !lowerMsg.match(/computaci[oó]n\s*[123]/)) {
    return `Tenemos 3 cursos disponibles, todos a S/ 200 c/u:

📝 **Computación 1**: Word Intermedio-Avanzado
📊 **Computación 2**: Excel Básico-Avanzado  
📈 **Computación 3**: SPSS y MS Project

Todos son 100% virtuales, con material disponible 24/7 y a tu propio ritmo. ¿Sobre cuál quieres saber más?`;
  }
  
  // Computación 1 específico
  if (lowerMsg.match(/computaci[oó]n\s*1/) || lowerMsg.includes('word')) {
    return `En **Computación 1** aprendes Microsoft Word a nivel intermedio-avanzado:

• Formato y edición avanzada
• Estilos y plantillas profesionales
• Tablas de contenido e índices
• Control de cambios y trabajo colaborativo

Costo: S/ 200 | 100% virtual | 4 evaluaciones

¿Te gustaría inscribirte o necesitas más información?`;
  }
  
  // Computación 2 específico
  if (lowerMsg.match(/computaci[oó]n\s*2/) || lowerMsg.includes('excel')) {
    return `En **Computación 2** dominas Microsoft Excel desde básico hasta avanzado:

• Fórmulas y funciones avanzadas
• Tablas dinámicas y análisis de datos
• Gráficos profesionales
• Macros básicas

Costo: S/ 200 | 100% virtual | 4 evaluaciones

¿Quieres saber cómo inscribirte?`;
  }
  
  // Computación 3 específico
  if (lowerMsg.match(/computaci[oó]n\s*3/) || lowerMsg.includes('spss') || lowerMsg.includes('project')) {
    return `En **Computación 3** aprendes dos herramientas profesionales:

📊 **IBM SPSS**: Análisis estadístico avanzado
📋 **MS Project**: Gestión profesional de proyectos

Costo: S/ 200 | 100% virtual | 4 evaluaciones

¿Te interesa este curso?`;
  }
  
  // Preguntas sobre modalidad
  if (lowerMsg.includes('virtual') || lowerMsg.includes('presencial') || lowerMsg.includes('horario')) {
    return `Los cursos son 100% virtuales a través del Aula USS (www.aulauss.edu.pe). No hay horarios fijos, avanzas a tu propio ritmo con acceso 24/7 al material.

Evaluación: 4 cuestionarios de 30 minutos cada uno.

¿Tienes alguna otra duda sobre la modalidad?`;
  }
  
  // Preguntas sobre elegibilidad
  if (lowerMsg.includes('elegible') || lowerMsg.includes('puedo llevar') || lowerMsg.includes('requisito')) {
    return `El programa es para egresados de pregrado de la USS hasta el ciclo 2023-2 que tienen pendiente la acreditación en cursos de computación.

Si eres de ciclo 2024-1 o posterior, debes contactar a paccis@uss.edu.pe para orientación.

¿Eres egresado hasta 2023-2?`;
  }
  
  // Contactos
  if (lowerMsg.includes('contacto') || lowerMsg.includes('telefono') || lowerMsg.includes('correo')) {
    return `Puedes contactarnos por:

📧 centrodeinformatica@uss.edu.pe
📞 986 724 506

🔧 Soporte técnico: ciso.dti@uss.edu.pe
📋 Constancias: acempresariales@uss.edu.pe
📚 Trámites académicos: paccis@uss.edu.pe

¿Necesitas ayuda con algo más?`;
  }
  
  // Respuesta genérica
  return `Estoy aquí para ayudarte con el Programa de Computación para Egresados USS. 

Puedo ayudarte con:
• Información sobre los cursos (Word, Excel, SPSS/Project)
• Proceso de inscripción
• Métodos de pago
• Requisitos y elegibilidad

¿Qué te gustaría saber?`;
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
