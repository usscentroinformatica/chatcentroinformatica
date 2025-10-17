const studentSessions = new Map();
const studentData = new Map();

// Función para extraer datos del estudiante (sin cambios)
function extractStudentData(message) {
  const data = {};
  const issues = [];
  
  // Extraer nombre
  const nombreMatch = message.match(/(?:mi nombre es|me llamo|soy)\s+([a-záéíóúüñ\s]+?)(?:,|\s+\d{4}|$)/i);
  if (nombreMatch && nombreMatch[1].trim().split(' ').length >= 2) {
    data.nombre = nombreMatch[1].trim();
  }
  
  // Extraer ciclo - CRÍTICO: Validar elegibilidad
  const cicloMatch = message.match(/(\d{4}-[12])/);
  if (cicloMatch) {
    data.ciclo = cicloMatch[1];
    const [year, semester] = data.ciclo.split('-');
    const yearNum = parseInt(year);
    const semesterNum = parseInt(semester);
    
    // Verificar si es elegible (hasta 2023-2)
    if (yearNum > 2023 || (yearNum === 2023 && semesterNum > 2)) {
      issues.push('ciclo_no_elegible');
      data.elegible = false;
    } else {
      data.elegible = true;
    }
  }
  
  // Extraer curso aprobado
  const cursoMatch = message.match(/(?:computaci[óo]n|comp)\s*([123]|ninguno)/i);
  if (cursoMatch) {
    data.ultimoCurso = cursoMatch[1] === 'ninguno' ? 'ninguno' : `Computación ${cursoMatch[1]}`;
  }
  
  // Extraer correo
  const correoMatch = message.match(/([a-zA-Z0-9._%+-]+@(?:uss\.edu\.pe|crece\.uss\.edu\.pe))/i);
  if (correoMatch) {
    data.correo = correoMatch[1].toLowerCase();
  }
  
  if (issues.length > 0) {
    data.issues = issues;
  }
  
  return data;
}

// Configuración del contexto del Centro de Informática USS (sin cambios)
const SYSTEM_CONTEXT = `Eres un asistente virtual del Centro de Informática de la Universidad Señor de Sipán (USS) en Chiclayo, Perú. Tu objetivo es ayudar al estudiante de manera natural y resolutiva, usando la información oficial y los mensajes institucionales. Solo deriva al contacto oficial si la consulta es demasiado específica o no puedes resolverla.

IMPORTANTE: El Programa de Computación para Egresados es para TODOS los egresados de pregrado de CUALQUIER carrera que tengan pendiente la acreditación de cursos de computación. NO menciones específicamente "Ingeniería de Sistemas" u otras carreras individuales; mantén el enfoque general para todas las carreras de pregrado.

INFORMACIÓN INSTITUCIONAL:
- Universidad: Universidad Señor de Sipán (USS)
- Área: Centro de Informática  
- Ubicación: Chiclayo, Perú
- Email: centrodeinformatica@uss.edu.pe
- Teléfono: 986 724 506

SERVICIOS QUE OFRECES:
1. **Programa de Computación para Egresados:**
   Invitación: Si aún no has acreditado el curso de Computación para Egresados, puedes hacerlo ahora. El programa es 100% virtual y de autoaprendizaje, disponible las 24 horas y sin horarios fijos. Para inscribirte, escribe y recibirás los pasos de inscripción.

   Información general:
   - Dirigido a egresados de pregrado (de cualquier carrera) hasta el ciclo 2023-2 que tengan pendiente la acreditación de cursos de computación.
   - Modalidad: 100% virtual (Aula USS)
   - Contenidos:
     - Computación 1: Microsoft Word (Intermedio – Avanzado)
     - Computación 2: Microsoft Excel (Básico – Intermedio – Avanzado)
     - Computación 3: IBM SPSS y MS Project
   - Costo por nivel: S/ 200
   - Manual con pasos para registro disponible.

   Confirmación de registro:
   Al inscribirte, recibirás acceso al Aula USS (www.aulauss.edu.pe) con tu usuario y contraseña institucional. El curso es autogestionado y debes completarlo antes del 31 de diciembre. Al finalizar, responde al correo para inscribirte al siguiente nivel.

   Finalización y acceso al siguiente nivel:
   Al terminar un nivel, puedes inscribirte en el siguiente realizando el pago y enviando el comprobante a centrodeinformatica@uss.edu.pe. Puedes llevar los niveles en paralelo.

2. **Constancias y Certificados:**
   - Constancia de Estudios
   - Constancia de Notas  
   - Constancia de Ranking
   - Certificado de Estudios
   - Costo: S/ 15.00 por documento
   - Tiempo: 3-5 días hábiles

3. **Horarios de Atención:**
   - Presencial: Lunes a Viernes 8:00 AM - 6:00 PM, Sábados 8:00 AM - 12:00 PM
   - Virtual: 24/7 través del chat
   - Email: Respuesta en 24-48 horas

4. **Información Académica:**
   - Matrícula y procesos académicos
   - Cursos: Computación I, II, III
   - Modalidades de pago

PERSONALIDAD:
- Profesional y amigable
- Usa emojis apropiados
- Proporciona información específica y útil
- Enfócate en el Programa de Computación para Egresados como general para todas las carreras de pregrado.
- Siempre ofrece contactos para consultas complejas

RESPUESTAS:
- Sé específico sobre los servicios del Centro de Informática
- Menciona costos, tiempos y requisitos cuando sea relevante
- Para dudas complejas, deriva a los contactos oficiales
- Mantén un tono profesional pero cercano`;

export default async function handler(req, res) {
  // Configurar CORS (sin cambios)
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
    const { message, sessionId = 'default' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }

    console.log('📩 Consulta recibida:', { sessionId, message: message.substring(0, 100) });

    // Extraer datos del estudiante del mensaje actual (sin cambios)
    const extractedData = extractStudentData(message);
    let currentData = studentData.get(sessionId) || {};
    currentData = { ...currentData, ...extractedData };
    currentData.lastActivity = Date.now();
    studentData.set(sessionId, currentData);

    // Determinar contexto adicional basado en elegibilidad (sin cambios)
    let additionalContext = '';
    if (currentData.ciclo && currentData.elegible === false) {
      additionalContext = `
      ATENCIÓN: El estudiante indicó que egresó en ${currentData.ciclo}.
      Este ciclo NO ES ELEGIBLE para el programa (posterior a 2023-2).
      Debes informarle amablemente que no puede acceder al programa y sugerir alternativas.
      NO continues con el proceso de inscripción.
      `;
    } else if (currentData.ciclo && currentData.elegible === true) {
      additionalContext = `
      El estudiante egresó en ${currentData.ciclo} - ES ELEGIBLE para el programa.
      Puedes continuar con el proceso de inscripción, incluyendo invitación y detalles completos.
      `;
    }

    // Verificar API key de Gemini (sin cambios)
    if (!process.env.GEMINI_API_KEY) {
      console.log('❌ GEMINI_API_KEY no configurada');
      return res.status(500).json({ 
        error: 'API key no configurada',
        response: 'Lo siento, hay un problema de configuración. Contacta a centrodeinformatica@uss.edu.pe o llama al 986 724 506.'
      });
    }

    // Obtener historial de sesión (sin cambios)
    let sessionHistory = studentSessions.get(sessionId) || [];
    
    // Agregar mensaje actual al historial
    sessionHistory.push({
      role: 'user',
      content: message
    });

    // Modelos a probar en orden (sin cambios, válidos en 2025)
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
                    text: `Contexto del sistema: ${SYSTEM_CONTEXT}\n\n${additionalContext}\n\nDatos actuales del estudiante: ${JSON.stringify(currentData)}\n\nHistorial de conversación:\n${sessionHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}\n\nResponde como asistente del Centro de Informática USS:`
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.6,
              maxOutputTokens: 768
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
        // ← FIX: Chequeo completo para evitar crash si no hay parts/text
        if (data.candidates && 
            data.candidates[0] && 
            data.candidates[0].content && 
            data.candidates[0].content.parts && 
            data.candidates[0].content.parts[0] && 
            data.candidates[0].content.parts[0].text) {
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

    // Agregar respuesta del bot al historial (sin cambios)
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
      sessionId: sessionId,
      studentData: currentData,
      isEligible: currentData.elegible !== false
    });

  } catch (error) {
    console.error('❌ Error en el servidor:', error);
    
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      response: 'Lo siento, hubo un problema técnico. Por favor contacta a:\n📧 centrodeinformatica@uss.edu.pe\n📱 986 724 506'
    });
  }
}