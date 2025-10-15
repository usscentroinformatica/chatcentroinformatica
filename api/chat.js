// Serverless API para Vercel - Centro de Informática USS
// Versión completa con extracción de datos, Google Sheets y validación

const { google } = require('googleapis');

// Almacenamiento en memoria para sesiones (limitado en serverless)
const studentSessions = new Map();

// Función para extraer datos del estudiante del mensaje
function extractStudentData(message) {
  console.log('🔍 EXTRAYENDO DATOS del mensaje:', message);
  const data = {};
  const issues = [];
  
  const cleanMessage = message.toLowerCase().trim();
  
  // Extraer nombre (múltiples patrones)
  const nombrePatterns = [
    /(?:mi nombre es|me llamo|soy)\s+([a-záéíóúüñ\s]+?)(?:,|\s+\d{4})/i,
    /^([a-záéíóúüñ\s]+?)(?:,|\s+\d{4})/i
  ];
  
  for (const pattern of nombrePatterns) {
    const match = message.match(pattern);
    if (match && match[1].trim().split(' ').length >= 2) {
      data.nombre = match[1].trim();
      console.log('✅ Nombre extraído:', data.nombre);
      break;
    }
  }
  
  // Extraer ciclo de egreso - FORMATO ESTRICTO: YYYY-N
  const cicloMatch = message.match(/(\d{4}-[12])/);
  if (cicloMatch) {
    data.ciclo = cicloMatch[1];
    console.log('✅ Ciclo extraído:', data.ciclo);
  } else if (message.match(/egresado[-\s]?\d/i)) {
    issues.push('ciclo_formato_incorrecto');
    console.log('❌ Formato de ciclo incorrecto detectado');
  }
  
  // Extraer último curso aprobado
  if (cleanMessage.includes('ninguno') || cleanMessage.includes('nunca')) {
    data.ultimoCurso = 'ninguno';
    console.log('✅ Curso extraído: ninguno');
  } else {
    const cursoPatterns = [
      /(?:computaci[óo]n|comp)\s*([123])/i,
      /(?:curso)\s*([123])/i,
      /,\s*([^,]+?)\s*,/i
    ];
    
    for (const pattern of cursoPatterns) {
      const match = message.match(pattern);
      if (match) {
        if (pattern.source.includes('([123])')) {
          data.ultimoCurso = `Computación ${match[1]}`;
        } else {
          const curso = match[1].trim();
          if (curso.match(/computaci[óo]n\s*[123]/i)) {
            data.ultimoCurso = curso.charAt(0).toUpperCase() + curso.slice(1);
          }
        }
        console.log('✅ Curso extraído:', data.ultimoCurso);
        break;
      }
    }
  }
  
  // Extraer correo institucional
  const correoMatch = message.match(/([a-zA-Z0-9._%+-]+@(?:uss\.edu\.pe|crece\.uss\.edu\.pe))/i);
  if (correoMatch) {
    data.correo = correoMatch[1].toLowerCase();
    console.log('✅ Correo extraído:', data.correo);
  }
  
  if (issues.length > 0) {
    data.formatoIncorrecto = issues;
  }
  
  console.log('📊 DATOS EXTRAÍDOS TOTAL:', data);
  return data;
}

// Función para verificar si los datos están completos
function isDataComplete(data) {
  console.log('🔍 VERIFICANDO SI DATOS ESTÁN COMPLETOS...');
  const completeness = {
    nombre: !!data.nombre,
    ciclo: !!data.ciclo,
    ultimoCurso: !!data.ultimoCurso,
    correo: !!data.correo,
    formatoIncorrecto: data.formatoIncorrecto
  };
  
  console.log('🔍 Evaluando completitud de datos:', completeness);
  
  const hasIncorrectFormat = data.formatoIncorrecto && data.formatoIncorrecto.length > 0;
  const missingFields = !completeness.nombre || !completeness.ciclo || !completeness.ultimoCurso || !completeness.correo;
  
  if (hasIncorrectFormat) {
    console.log('❌ Datos con formato incorrecto');
    return false;
  }
  
  if (missingFields) {
    console.log('❌ Faltan campos requeridos');
    return false;
  }
  
  console.log('✅ TODOS LOS DATOS ESTÁN COMPLETOS - LISTO PARA GUARDAR!');
  return true;
}

// Función para guardar en Google Sheets
async function saveToGoogleSheets(studentData) {
  try {
    console.log('🔄 Intentando guardar en Google Sheets:', studentData.nombre);
    
    // Verificar variables de entorno
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SHEET_ID) {
      console.log('⚠️ Variables de Google Sheets no configuradas');
      return { success: false, error: 'Variables de entorno faltantes' };
    }
    
    // Configurar autenticación
    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: "service_account",
        project_id: process.env.GOOGLE_PROJECT_ID || "chatbot-uss",
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs"
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // Preparar datos para insertar
    const timestamp = new Date().toLocaleString('es-PE');
    const rowData = [
      timestamp,
      studentData.nombre || 'No proporcionado',
      studentData.ciclo || 'No proporcionado', 
      studentData.ultimoCurso || 'No proporcionado',
      'Por determinar', // Curso que corresponde
      studentData.correo || 'No proporcionado',
      'Datos_Recopilados'
    ];

    console.log('📝 Datos preparados:', rowData);

    // Insertar datos
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Estudiantes!A:G',
      valueInputOption: 'RAW',
      resource: {
        values: [rowData]
      }
    });

    console.log('✅ Respuesta de Google Sheets:', response.data);
    console.log('✅ Datos guardados en Google Sheets para:', studentData.nombre);
    
    return { 
      success: true, 
      data: response.data,
      studentName: studentData.nombre
    };

  } catch (error) {
    console.error('❌ Error guardando en Google Sheets:', error.message);
    return { success: false, error: error.message };
  }
}

// Función principal del endpoint
module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDB0hTWu-d3i5EIlzA34KwjEN4nQiq_SjE';
    
    const { message, sessionId } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }

    console.log('🆔 SessionId recibido:', sessionId);
    console.log('💬 Mensaje recibido:', message);

    // Extraer datos del mensaje
    const extractedData = extractStudentData(message);
    
    // Obtener datos previos de la sesión (limitado en serverless)
    let sessionData = studentSessions.get(sessionId) || {};
    
    // Combinar datos previos con nuevos datos
    Object.assign(sessionData, extractedData);
    sessionData.lastActivity = Date.now();
    
    // Guardar sesión actualizada
    studentSessions.set(sessionId, sessionData);
    
    console.log('📋 Datos actualizados en sesión:', sessionData);

    // Verificar si los datos están completos
    const dataComplete = isDataComplete(sessionData);
    
    if (dataComplete) {
      console.log('🎯 DATOS COMPLETOS DETECTADOS - GUARDANDO INMEDIATAMENTE...');
      
      // Guardar en Google Sheets
      const saveResult = await saveToGoogleSheets(sessionData);
      if (saveResult.success) {
        console.log('✅ Datos guardados exitosamente en Google Sheets para:', saveResult.studentName);
      } else {
        console.log('⚠️ Error al guardar en Google Sheets:', saveResult.error);
      }
    }

    // Generar respuesta contextual
    let contextualPrompt = '';
    
    if (sessionData.formatoIncorrecto && sessionData.formatoIncorrecto.includes('ciclo_formato_incorrecto')) {
      contextualPrompt = `El usuario está proporcionando un formato incorrecto para el ciclo de egreso. 

CORRIGE AMABLEMENTE: "Necesito que me proporciones tu ciclo de egreso en el formato correcto: YYYY-N (ejemplo: 2022-1 o 2023-2). Por favor escribe tu ciclo usando este formato: año de 4 dígitos, guión, y número del ciclo (1 o 2)."

NO sigas con otras preguntas hasta que corrija el formato.`;
    } else if (!dataComplete) {
      const missing = [];
      if (!sessionData.nombre) missing.push('nombre completo');
      if (!sessionData.ciclo) missing.push('ciclo de egreso (formato: YYYY-N, ej: 2022-1)');
      if (!sessionData.ultimoCurso) missing.push('último curso de computación aprobado (o "ninguno")');
      if (!sessionData.correo) missing.push('correo institucional USS (@uss.edu.pe o @crece.uss.edu.pe)');
      
      contextualPrompt = `Necesito los siguientes datos para procesar la inscripción: ${missing.join(', ')}.

FORMATO IMPORTANTE para ciclo: YYYY-N (ejemplo: 2022-1, 2023-2)
FORMATO IMPORTANTE para correo: Debe terminar en @uss.edu.pe o @crece.uss.edu.pe

Por favor proporciona estos datos en un solo mensaje, separados por comas.`;
    } else {
      contextualPrompt = `✅ DATOS COMPLETOS RECIBIDOS Y REGISTRADOS:
- Nombre: ${sessionData.nombre}
- Ciclo de egreso: ${sessionData.ciclo} 
- Último curso: ${sessionData.ultimoCurso}
- Correo: ${sessionData.correo}

Los datos han sido registrados automáticamente en nuestro sistema. Te enviaremos los pasos para el pago a tu correo institucional. Ahora puedo ayudarte con cualquier consulta sobre el programa.`;
    }

    // Contexto del programa completo
    const contextoPrograma = `Eres un asistente amigable y profesional del Centro de Informática de la Universidad Señor de Sipán (USS).

${contextualPrompt}

INFORMACIÓN DEL PROGRAMA:
- Nombre: Programa de Computación para Egresados USS
- Dirigido a: Egresados de pregrado USS hasta el ciclo 2023-2 que tengan pendiente acreditación de cursos de computación
- Modalidad: 100% virtual mediante Aula USS (www.aulauss.edu.pe)
- Disponibilidad: 24/7, autoaprendizaje
- Costo: S/ 200 por nivel
- Fecha límite: 31 de diciembre para completar actividades

NIVELES DISPONIBLES:
1. Computación 1: Microsoft Word (Intermedio-Avanzado)
2. Computación 2: Microsoft Excel (Básico-Intermedio-Avanzado)  
3. Computación 3: IBM SPSS y MS Project

PROCESO DE INSCRIPCIÓN:
1. Solicitar correo institucional USS del estudiante (@uss.edu.pe o @crece.uss.edu.pe)
2. Confirmar que le enviaremos los pasos para el pago a su correo
3. El estudiante debe realizar pago de S/ 200
4. Debe responder al correo adjuntando voucher de pago a centrodeinformatica@uss.edu.pe
5. Esperar registro en Aula USS

FORMAS DE PAGO (S/ 200):

A) CAMPUS VIRTUAL USS:
1. Ingresar a Campus Virtual USS
2. Ir a "Trámites"
3. Seleccionar "Programación de Servicios"
4. Escuela Profesional: INGENIERÍA DE SISTEMAS (Egresado)
5. Seleccionar "Programa de Computación para Egresados"
6. Llenar datos solicitados
7. Click "Programar"
8. Ir a "Gestión Financiera" → "Pagos con tarjeta-QR"
9. Realizar el pago

B) YAPE:
- Yapear a: Universidad Señor de Sipán
- Buscar: "Servicios Programables"
- Monto: S/ 200

C) APLICATIVO BCP:
- App BCP → Pagar servicios → Universidad Señor de Sipán
- Ingresar código de alumno → Seleccionar servicio programado

D) AGENTE/AGENCIA BCP:
- Número de cuenta: 305-1552328-0-87
- Tiempo reflejo: 3-5 horas (app/agencia), 24h (agente)

ACCESO AULA USS:
- URL: www.aulauss.edu.pe
- Usuario: Código de alumno
- Contraseña: Contraseña institucional

EVALUACIÓN:
- 4 Cuestionarios (C1, C2, C3, C4)
- Promedio = (C1 + C2 + C3 + C4) / 4

CONSTANCIAS DE EGRESO:
- Solicitar en Mesa de Partes (presencial/virtual)
- Costo: S/ 15
- Tiempo de entrega: 3-5 días hábiles
- Requisitos: DNI, foto, pago

HORARIOS DE ATENCIÓN:
- Presencial: Lunes a Viernes 8:00 AM - 5:00 PM
- Virtual: 24/7 mediante este chatbot
- Respuesta por correo: 24-48 horas

CONTACTO:
- Email: centrodeinformatica@uss.edu.pe
- WhatsApp: 986 724 506
- Instagram: @centrodeinformaticauss
- Facebook: Centro de Informática USS

Responde de manera amigable y profesional. Si no tienes información específica, dirige al estudiante a contactar directamente centrodeinformatica@uss.edu.pe o WhatsApp 986 724 506.`;

    // Llamar a Gemini AI
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: contextoPrograma },
              { text: `Usuario dice: ${message}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Respuesta inválida de la API de Gemini');
    }

    const botResponse = data.candidates[0].content.parts[0].text;

    console.log('✅ Respuesta generada exitosamente');
    
    return res.status(200).json({
      response: botResponse,
      dataComplete: dataComplete,
      sessionData: sessionData
    });

  } catch (error) {
    console.error('❌ Error en /api/chat:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
};