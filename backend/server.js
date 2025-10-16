// Servidor Express para el Chatbot USS - Centro de Informática
// Programa de Computación para Egresados con validación de elegibilidad
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Variables para almacenar sesiones temporalmente en memoria
const conversationHistory = new Map();
const studentData = new Map();

// Middleware
app.use(cors());
app.use(express.json());

// Verificar API Key de Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY no está configurada');
} else {
  console.log('✅ GEMINI_API_KEY configurada');
}

// Función para extraer datos del estudiante
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

// Contexto actualizado del Centro de Informática USS
const SYSTEM_CONTEXT = `
Eres un asistente virtual del Centro de Informática de la Universidad Señor de Sipán (USS).

PROGRAMA DE COMPUTACIÓN PARA EGRESADOS:

🎯 ELEGIBILIDAD (MUY IMPORTANTE):
- ✅ PUEDEN INSCRIBIRSE: Solo egresados de pregrado hasta el ciclo 2023-2 que tengan pendiente la acreditación de cursos de computación.
- ❌ NO PUEDEN INSCRIBIRSE: Egresados desde 2024-1 en adelante.
- Si alguien del 2024-1 o posterior pregunta, debes informar amablemente que NO es elegible y sugerir contactar a su Escuela Profesional para alternativas.

📋 PROCESO DE INSCRIPCIÓN:
1. Verificar elegibilidad (ciclo hasta 2023-2).
2. Solicitar datos: nombre completo, ciclo (YYYY-N), último curso aprobado, correo USS.
3. Si es elegible, proporcionar los pasos de inscripción: indicar proceso de pago (S/ 200 por nivel), enviar voucher a centrodeinformatica@uss.edu.pe.
4. Adjuntar o describir el manual con pasos para registro si es posible.
5. Una vez registrado, confirmar acceso a www.aulauss.edu.pe con usuario y contraseña institucional.
6. Fecha límite para completar actividades y cuestionarios: 31 de diciembre.
7. Al finalizar un nivel, responder al correo indicando conclusión para proceder al siguiente (pueden llevarse en paralelo si prefieren).

💻 NIVELES DISPONIBLES:
- Computación 1: Microsoft Word (Intermedio-Avanzado)
- Computación 2: Microsoft Excel (Básico-Intermedio-Avanzado)
- Computación 3: IBM SPSS y MS Project

💰 COSTO: S/ 200 por nivel

🏫 MODALIDAD: 100% virtual y de autoaprendizaje mediante Aula USS (www.aulauss.edu.pe). Sin horarios fijos, disponible 24 horas. Puedes completarlo en pocos días según tu disponibilidad.

📱 CONTACTO:
- Email: centrodeinformatica@uss.edu.pe
- WhatsApp: 986 724 506
- Horario de atención presencial: Lunes a Viernes: 8:00 AM - 6:00 PM; Sábados: 8:00 AM - 12:00 PM

OTRAS CONSULTAS:
- Para temas relacionados con constancias: deriva a acempresariales@uss.edu.pe.
- Para cambios de horario o cruces con el curso de Computación (ej. semana 6 en adelante): informa que no es posible y deriva a paccis@uss.edu.pe para apoyo del docente.

RESPUESTAS SEGÚN ELIGIBILIDAD:
- Si el ciclo es 2024-1 o posterior: "Lamento informarte que el Programa de Computación para Egresados está disponible únicamente para egresados hasta el ciclo 2023-2. Te sugiero contactar a tu Escuela Profesional para conocer las alternativas disponibles."
- Si es elegible: Procede con el registro normal, invitando al programa: "Hola 👋 Si aún no has acreditado el curso de Computación para Egresados, esta es tu oportunidad para hacerlo. El programa es 100% virtual y de autoaprendizaje... [detalles completos]."

INFORMACIÓN ADICIONAL PARA CONFIRMACIONES:
- Confirmación de registro: "Hola 👋, confirmamos que ya has sido registrado(a) en el Aula USS... [detalles]."
- Finalización de curso: "Hola 👋, felicitaciones por concluir... [pasos para siguiente nivel]."

INSTRUCCIONES:
- Sé amable pero claro sobre los requisitos.
- Verifica SIEMPRE el ciclo de egreso antes de proceder.
- No des información de pago a estudiantes no elegibles.
- Usa emojis y formato amigable en respuestas.
- Siempre incluye invitación inicial si procede.
`;

// Ruta principal
app.get('/', (req, res) => {
  res.json({ 
    message: 'API del Chatbot USS - Centro de Informática',
    timestamp: new Date().toISOString(),
    version: 'v2.1 - Programa Computación con info actualizada'
  });
});

// Endpoint principal del chat
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId = 'default' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }

    console.log(`📩 Consulta recibida - Sesión: ${sessionId}`);
    console.log(`💬 Mensaje: ${message}`);

    // Extraer datos del mensaje
    const extractedData = extractStudentData(message);
    
    // Obtener datos previos de la sesión
    let currentData = studentData.get(sessionId) || {};
    Object.assign(currentData, extractedData);
    studentData.set(sessionId, currentData);

    console.log('📊 Datos del estudiante:', currentData);

    // Crear contexto específico basado en los datos
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

    // Verificar API key
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: 'API key de Gemini no configurada',
        response: 'Error de configuración. Contacta al administrador.'
      });
    }

    // Intentar con diferentes modelos de Gemini
    const modelsToTry = [
      'gemini-2.0-flash-exp',
      'gemini-2.5-flash-lite',
      'gemini-1.5-flash',
      'gemini-1.5-pro'
    ];

    let botResponse = '';
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        console.log(`🤖 Probando modelo: ${model}`);
        
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `${SYSTEM_CONTEXT}\n\n${additionalContext}\n\nDatos actuales del estudiante: ${JSON.stringify(currentData)}\n\nMensaje del usuario: ${message}\n\nResponde como asistente del Centro de Informática USS:`
                    }
                  ]
                }
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1024,
              }
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            botResponse = data.candidates[0].content.parts[0].text;
            console.log(`✅ Respuesta obtenida del modelo: ${model}`);
            break;
          }
        } else {
          const errorText = await response.text();
          console.log(`❌ Error con modelo ${model}:`, errorText);
          lastError = errorText;
        }
      } catch (error) {
        console.log(`❌ Error al conectar con ${model}:`, error.message);
        lastError = error.message;
      }
    }

    if (!botResponse) {
      // Respuesta de emergencia actualizada
      botResponse = `Lo siento, estoy teniendo problemas técnicos. 

Por favor contacta directamente a:
📧 centrodeinformatica@uss.edu.pe
📱 986 724 506

Horario de atención presencial:
Lunes a Viernes: 8:00 AM - 6:00 PM
Sábados: 8:00 AM - 12:00 PM`;
    }

    // Guardar conversación
    let history = conversationHistory.get(sessionId) || [];
    history.push({ role: 'user', content: message });
    history.push({ role: 'assistant', content: botResponse });
    
    if (history.length > 20) {
      history = history.slice(-20);
    }
    conversationHistory.set(sessionId, history);

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
      response: 'Hubo un problema técnico. Por favor contacta a:\n📧 centrodeinformatica@uss.edu.pe\n📱 986 724 506'
    });
  }
});

// Endpoint para verificar elegibilidad
app.post('/api/check-eligibility', (req, res) => {
  try {
    const { ciclo } = req.body;
    
    if (!ciclo || !ciclo.match(/\d{4}-[12]/)) {
      return res.status(400).json({ 
        error: 'Formato de ciclo inválido',
        format: 'YYYY-N (ejemplo: 2023-2)'
      });
    }

    const [year, semester] = ciclo.split('-');
    const yearNum = parseInt(year);
    const semesterNum = parseInt(semester);
    
    const isEligible = yearNum < 2023 || (yearNum === 2023 && semesterNum <= 2);

    res.json({
      ciclo: ciclo,
      eligible: isEligible,
      message: isEligible 
        ? '✅ Eres elegible para el programa'
        : '❌ Lo sentimos, el programa solo está disponible para egresados hasta 2023-2'
    });

  } catch (error) {
    res.status(500).json({ error: 'Error verificando elegibilidad' });
  }
});

// Endpoint para limpiar sesión
app.post('/api/clear-session', (req, res) => {
  try {
    const { sessionId = 'default' } = req.body;
    conversationHistory.delete(sessionId);
    studentData.delete(sessionId);
    
    res.json({ 
      message: 'Sesión limpiada correctamente',
      sessionId: sessionId
    });
    
    console.log(`🧹 Sesión limpiada: ${sessionId}`);
  } catch (error) {
    res.status(500).json({ error: 'Error limpiando sesión' });
  }
});

// Limpiar sesiones viejas cada 30 minutos
setInterval(() => {
  const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
  let cleaned = 0;
  
  for (const [sessionId, data] of studentData.entries()) {
    if (!data.lastActivity || data.lastActivity < thirtyMinutesAgo) {
      conversationHistory.delete(sessionId);
      studentData.delete(sessionId);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 Limpieza automática: ${cleaned} sesiones eliminadas`);
  }
}, 30 * 60 * 1000);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📡 Centro de Informática USS - Chatbot v2.1`);
  console.log(`✅ Validación de elegibilidad activada (hasta 2023-2) con info actualizada`);
  
  if (!GEMINI_API_KEY) {
    console.log(`⚠️  ADVERTENCIA: GEMINI_API_KEY no configurada`);
  } else {
    console.log(`✅ Gemini AI configurado correctamente`);
  }
});