// Servidor Express para el Chatbot USS.
// Expone endpoints HTTP para salud y chat y delega generación a la API de Gemini.
// Requiere variables de entorno: GEMINI_API_KEY y opcionalmente PORT.
// Mantener las respuestas y mensajes en español para coherencia con el público objetivo.
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const GoogleSheetsManager = require('./googleSheets');
const LocalDataManager = require('./localData');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Inicializar gestores de datos
const sheetsManager = new GoogleSheetsManager();
const localDataManager = new LocalDataManager();

// Variables para almacenar sesiones de estudiantes
const studentSessions = new Map();
const conversationHistory = new Map();

// Función para extraer datos del estudiante del mensaje
function extractStudentData(message, conversationHistory = []) {
  console.log('🔍 EXTRAYENDO DATOS del mensaje:', message);
  const data = {};
  const issues = []; // Para rastrear problemas en el formato
  
  // Limpiar mensaje
  const cleanMessage = message.toLowerCase().trim();
  
  // Extraer nombre (múltiples patrones)
  const nombrePatterns = [
    /(?:mi nombre es|me llamo|soy)\s+([a-záéíóúüñ\s]+?)(?:,|\s+\d{4})/i,
    /^([a-záéíóúüñ\s]+?)(?:,|\s+\d{4})/i  // Nombre al inicio del mensaje
  ];
  
  for (const pattern of nombrePatterns) {
    const match = message.match(pattern);
    if (match && match[1].trim().split(' ').length >= 2) { // Al menos 2 palabras
      data.nombre = match[1].trim();
      console.log('✅ Nombre extraído:', data.nombre);
      break;
    }
  }
  
  // Extraer ciclo de egreso - FORMATO ESTRICTO: YYYY-N (ej: 2023-1, 2022-2)
  const cicloMatch = message.match(/(\d{4}-[12])/);
  if (cicloMatch) {
    data.ciclo = cicloMatch[1];
    console.log('✅ Ciclo extraído:', data.ciclo);
  } else {
    // Detectar formatos incorretos comunes
    if (message.match(/egresado[-\s]?\d/i)) {
      issues.push('ciclo_formato_incorrecto');
      console.log('❌ Formato de ciclo incorrecto detectado: egresado-X (debe ser YYYY-N)');
    }
  }
  
  // Extraer último curso aprobado
  if (cleanMessage.includes('ninguno') || cleanMessage.includes('nunca')) {
    data.ultimoCurso = 'ninguno';
    console.log('✅ Curso extraído: ninguno');
  } else {
    // Patrones más flexibles para detectar cursos
    const cursoPatterns = [
      /(?:computaci[óo]n|comp)\s*([123])/i,  // computación/computacion + número
      /(?:curso)\s*([123])/i,               // curso + número
      /,\s*([^,]+?)\s*,/i                   // tercer elemento entre comas
    ];
    
    for (const pattern of cursoPatterns) {
      const match = message.match(pattern);
      if (match) {
        if (pattern.source.includes('([123])')) {
          // Es un patrón de número
          data.ultimoCurso = `Computación ${match[1]}`;
        } else {
          // Es el texto entre comas
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
  
  // Agregar problemas detectados a los datos
  if (issues.length > 0) {
    data.formatoIncorrecto = issues;
    console.log('⚠️ Problemas detectados:', issues);
  }
  
  console.log('📊 DATOS EXTRAÍDOS TOTAL:', data);
  return data;
}

// Función para verificar si los datos están completos Y correctamente formateados
function isDataComplete(studentData) {
  console.log('🔍 Evaluando completitud de datos:', {
    nombre: !!studentData.nombre,
    ciclo: !!studentData.ciclo, 
    ultimoCurso: !!studentData.ultimoCurso,
    correo: !!studentData.correo,
    formatoIncorrecto: studentData.formatoIncorrecto
  });
  
  // Primero verificar que todos los campos estén presentes
  const hasAllFields = !!(
    studentData.nombre && 
    studentData.ciclo && 
    studentData.ultimoCurso && 
    studentData.correo
  );
  
  if (!hasAllFields) {
    console.log('❌ Faltan campos requeridos');
    return false;
  }
  
  // Si hay problemas de formato activos, los datos NO están completos
  if (studentData.formatoIncorrecto && studentData.formatoIncorrecto.length > 0) {
    console.log('❌ Datos incompletos por formato incorrecto:', studentData.formatoIncorrecto);
    return false;
  }
  
  // Validación final del formato del ciclo (solo si existe)
  if (studentData.ciclo && !studentData.ciclo.match(/^\d{4}-[12]$/)) {
    console.log('❌ Formato de ciclo inválido en validación final:', studentData.ciclo);
    return false;
  }
  
  console.log('✅ Todos los datos están completos y válidos');
  return true;
}

// Función para generar mensaje de corrección de formato
function generateFormatCorrectionMessage(studentData) {
  let mensaje = "❌ **Hay un problema con el formato de tus datos.** Por favor, proporciona la información en el formato correcto:\n\n";
  
  if (studentData.formatoIncorrecto && studentData.formatoIncorrecto.includes('ciclo_formato_incorrecto')) {
    mensaje += "🚫 **Ciclo de egreso incorrecto:** Escribiste algo como 'egresado-2', pero necesito el año exacto.\n";
    mensaje += "✅ **Formato correcto:** YYYY-N (ejemplo: 2023-1, 2022-2, 2021-1, 2020-2, etc.)\n\n";
  }
  
  mensaje += "📝 **Por favor, envía nuevamente tus datos en este formato:**\n";
  mensaje += "**Nombre Completo, YYYY-N, Computación X, correo@uss.edu.pe**\n\n";
  mensaje += "**Ejemplo correcto:**\n";
  mensaje += "`Miguel Maquen, 2022-2, Computación 1, mmujicamiguelan@uss.edu.pe`\n\n";
  mensaje += "¿En qué año y ciclo egresaste exactamente? 😊";
  
  return mensaje;
}

// Función para determinar qué curso le corresponde
function determinarCursoCorresponde(ultimoCurso, aprobado = true) {
  if (!ultimoCurso || ultimoCurso.includes('ninguno') || ultimoCurso.includes('nunca')) {
    return 'Computación 1';
  }
  
  if (ultimoCurso.includes('1') && aprobado) {
    return 'Computación 2';
  } else if (ultimoCurso.includes('2') && aprobado) {
    return 'Computación 3';
  } else if (ultimoCurso.includes('3') && aprobado) {
    return 'Ya completó todos los niveles';
  } else {
    // Si no aprobó, debe repetir el mismo curso
    return ultimoCurso;
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Clave de API para Google Gemini leída desde variables de entorno.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Contexto del programa (prompt del sistema) enviado junto al mensaje del usuario
const contextoPrograma = `Eres un asistente amigable y profesional del Centro de Informática de la Universidad Señor de Sipán (USS).

FLUJO DE ATENCIÓN INICIAL:
Cuando un usuario te salude o inicie conversación por primera vez, SIEMPRE pide estos datos antes de dar información:

"¡Hola! 👋 Bienvenido al Centro de Informática USS. Para ayudarte con el Programa de Computación para Egresados, necesito los siguientes datos:

📝 **Por favor, compárteme en un solo mensaje CON EL FORMATO EXACTO:**
1️⃣ Tu nombre completo
2️⃣ Tu ciclo de egreso **EN FORMATO AÑO-CICLO** (ej: 2023-1, 2022-2, 2021-1, 2020-2)
3️⃣ Último curso de computación que APROBASTE exitosamente (Computación 1, 2 o 3, o 'ninguno' si nunca llevaste)
4️⃣ Tu correo institucional USS (@uss.edu.pe o @crece.uss.edu.pe)

VALIDACIÓN DE CURSOS IMPORTANTE:
Si el usuario menciona que "llevó" un curso pero no especifica si lo aprobó, SIEMPRE pregunta de manera clara:

"Para asegurarme de darte la información correcta:
¿APROBASTE el curso de Computación [número] o lo llevaste pero no lo terminaste/aprobaste?

- Si lo APROBASTE → Te corresponde acreditar el siguiente nivel
- Si NO lo aprobaste → Debes retomar ese mismo nivel

Por favor, confírmame tu situación exacta 😊"

VALIDACIÓN DE ELEGIBILIDAD:
Una vez recibas los datos, valida:
- Si egresó en 2023-2 o ANTES (2023-1, 2022-2, 2021-1, 2020-2, 2018-2, etc.) → ES ELEGIBLE, ayúdalo normalmente
- Si egresó en 2024-1 o DESPUÉS (2024-1, 2024-2, 2025-1, etc.) → NO ES ELEGIBLE, responde:

"Gracias por tu información, [Nombre]. Lamentablemente, el Programa de Computación para Egresados está dirigido únicamente a egresados hasta el ciclo 2023-2.

Como egresaste en [ciclo], te recomiendo contactar a:
📧 **paccis@uss.edu.pe**

Ellos podrán orientarte sobre otras opciones disponibles para tu situación. ¡Mucho éxito! 😊"

INFORMACIÓN ADICIONAL - OTROS SERVICIOS:

📋 CONSTANCIAS Y CERTIFICADOS:
Si el usuario pregunta sobre constancias, certificados de estudios, o trámites académicos, responde:

"Estimado/a Estudiante:

Para temas relacionados con constancias, puede comunicarse directamente con el área correspondiente al correo **acempresariales@uss.edu.pe**

Ellos podrán ayudarte con:
- Constancias de estudios
- Certificados académicos  
- Trámites documentarios
- Otros servicios académicos

¡Saludos! 😊"

🕒 CAMBIO DE HORARIOS:
Si el usuario pregunta sobre cambio de horarios para cursos de computación, responde:

"Estimado/a Estudiante:

Para solicitar el cambio de horarios del curso de Computación, debes comunicarte con **PACCIS** al correo **paccis@uss.edu.pe**, adjuntando las pruebas que sustenten tu solicitud. 

Te recomendamos además revisar los horarios disponibles para evitar cruces con tus demás cursos.

📧 Correo: paccis@uss.edu.pe
📝 Recuerda adjuntar documentos que justifiquen tu solicitud

¡Saludos! 😊"

INFORMACIÓN DEL PROGRAMA (Solo dar si es elegible):
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

LÓGICA DE ASIGNACIÓN DE CURSOS:
- Si APROBÓ Computación 1 → Le corresponde acreditar Computación 2
- Si APROBÓ Computación 2 → Le corresponde acreditar Computación 3  
- Si APROBÓ Computación 3 → Ya completó todos los niveles (no necesita el programa)
- Si NO aprobó algún curso → Debe retomar ese mismo nivel que no aprobó
- Si nunca llevó computación → Debe empezar con Computación 1

EJEMPLOS DE RESPUESTAS SEGÚN EL CASO:
▪️ "Aprobé Computación 2" → "Te corresponde acreditar Computación 3 (IBM SPSS y MS Project)"
▪️ "Llevé Computación 2 pero no lo aprobé" → "Necesitas acreditar Computación 2 (Microsoft Excel)"
▪️ "Nunca llevé cursos de computación" → "Debes empezar con Computación 1 (Microsoft Word)"

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
5. Servicio: PROGRAMA DE COMPUTACIÓN PARA EGRESADOS USS
6. Cantidad: 1, Importe: 200.00
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

CONTACTO:
- Email: centrodeinformatica@uss.edu.pe
- WhatsApp: 986 724 506
- Instagram: @centrodeinformaticauss
- Facebook: Centro de Informática USS

DETECCIÓN AUTOMÁTICA DE CONSULTAS ESPECIALES:

🔍 PALABRAS CLAVE PARA CONSTANCIAS:
Si el usuario menciona: "constancia", "certificado", "constancias", "certificados", "documento", "documentos", "trámite", "trámites", responde automáticamente con la información de constancias (acempresariales@uss.edu.pe)

🔍 PALABRAS CLAVE PARA CAMBIO DE HORARIOS:  
Si el usuario menciona: "horario", "horarios", "cambio de horario", "cambiar horario", "modificar horario", "reprogramar", responde automáticamente con la información de cambio de horarios (paccis@uss.edu.pe)

🔍 DETECCIÓN DE ESTUDIANTES NO ELEGIBLES:
Si alguien pregunta sobre el programa pero NO es egresado (menciona que es estudiante actual, está cursando, etc.), direcciona inmediatamente a paccis@uss.edu.pe

INSTRUCCIONES CRÍTICAS:
- PRIORIDAD 1: Detectar consultas sobre constancias o horarios y responder inmediatamente
- PRIORIDAD 2: Si es sobre el programa de egresados, pedir los 4 datos completos
- Si NO tienes los 4 datos completos (nombre, ciclo, curso, correo), pide TODOS en un solo mensaje
- Una vez que tengas los 4 datos completos, NUNCA los vuelvas a pedir
- Con datos completos, solo responde preguntas específicas sobre el programa
- Valida el ciclo: 2023-2 o antes = elegible, 2024-1 o después = deriva a paccis@uss.edu.pe
- Sé amigable y natural en todo momento
- Usa emojis apropiadamente
- Respuestas concisas pero completas
- Si ya tienes todos los datos, actúa como un asistente informativo normal del programa

MODO POST-REGISTRO:
Una vez que tengas nombre + ciclo + curso + correo, cambia completamente tu comportamiento:
- NO pidas más datos
- Responde cualquier pregunta sobre el programa
- Proporciona información detallada cuando se solicite
- Mantén un tono profesional y servicial
- SIEMPRE detecta si preguntan sobre constancias o horarios y responde apropiadamente`;

// Ruta principal
app.get('/', (req, res) => {
  res.json({ 
    message: 'API del Chatbot USS funcionando correctamente',
    timestamp: new Date().toISOString(),
    endpoints: {
      chat: 'POST /api/chat',
      estudiantes: 'GET /api/estudiantes', 
      csv: 'GET /api/estudiantes/csv',
      stats: 'GET /api/stats'
    }
  });
});

// Endpoint para limpiar sesión específica
app.post('/api/clear-session', (req, res) => {
  try {
    const { sessionId = 'default' } = req.body;
    
    // Limpiar datos de la sesión
    studentSessions.delete(sessionId);
    conversationHistory.delete(sessionId);
    
    res.json({ 
      message: 'Sesión limpiada correctamente',
      sessionId: sessionId,
      timestamp: new Date().toISOString()
    });
    
    console.log(`🧹 Sesión limpiada manualmente: ${sessionId}`);
  } catch (error) {
    res.status(500).json({ error: 'Error limpiando sesión' });
  }
});

// Endpoint para limpiar todas las sesiones
app.post('/api/clear-all-sessions', (req, res) => {
  try {
    const totalSessions = studentSessions.size;
    
    // Limpiar todas las sesiones
    studentSessions.clear();
    conversationHistory.clear();
    
    res.json({ 
      message: 'Todas las sesiones limpiadas',
      sessionsCleaned: totalSessions,
      timestamp: new Date().toISOString()
    });
    
    console.log(`🧹 Todas las sesiones limpiadas: ${totalSessions}`);
  } catch (error) {
    res.status(500).json({ error: 'Error limpiando sesiones' });
  }
});

// Endpoint para ver sesiones activas (debug)
app.get('/api/sessions', (req, res) => {
  try {
    const sessions = [];
    const now = Date.now();
    
    for (const [sessionId, data] of studentSessions.entries()) {
      const minutesAgo = Math.round((now - (data.lastActivity || 0)) / (60 * 1000));
      sessions.push({
        sessionId,
        minutesInactive: minutesAgo,
        hasData: !!(data.nombre && data.ciclo && data.correo),
        studentName: data.nombre || 'Sin nombre',
        lastActivity: new Date(data.lastActivity || 0).toLocaleString('es-PE')
      });
    }
    
    res.json({
      totalSessions: studentSessions.size,
      sessions: sessions.sort((a, b) => a.minutesInactive - b.minutesInactive),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo sesiones' });
  }
});

// Endpoint de estadísticas rápidas
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await localDataManager.getStats();
    res.json({
      ...stats,
      sesiones_activas: studentSessions.size,
      conversaciones_activas: conversationHistory.size,
      timestamp: new Date().toISOString(),
      sistema: 'Local CSV + Google Sheets backup'
    });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
});

// Endpoint de prueba para extracción de datos
app.post('/api/test-extraction', (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }
    
    const extractedData = extractStudentData(message);
    const complete = isDataComplete(extractedData);
    
    res.json({
      mensaje: message,
      datos_extraidos: extractedData,
      datos_completos: complete,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Error en extracción de datos' });
  }
});

// Endpoint de prueba para simular guardado completo
app.post('/api/test-save', async (req, res) => {
  try {
    const testData = {
      nombre: 'Miguel Maquen TEST',
      ciclo: '2022-2',
      ultimoCurso: 'Computación 1',
      correo: 'mmujicamiguelan@uss.edu.pe',
      cursoCorresponde: 'Computación 2'
    };
    
    console.log('🧪 PROBANDO GUARDADO DIRECTO...');
    
    // Probar guardado local
    const localSuccess = await localDataManager.saveStudentData(testData);
    console.log('💾 Guardado local:', localSuccess);
    
    // Probar guardado en Google Sheets
    const sheetsSuccess = await sheetsManager.saveStudentData(testData);
    console.log('📊 Guardado Google Sheets:', sheetsSuccess);
    
    res.json({
      testData,
      results: {
        local: localSuccess,
        googleSheets: sheetsSuccess
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error en prueba de guardado:', error);
    res.status(500).json({ error: 'Error en prueba de guardado', details: error.message });
  }
});

// Endpoint para consultar datos de estudiantes (lee desde archivo local)
app.get('/api/estudiantes', async (req, res) => {
  try {
    const estudiantes = await localDataManager.getStudentData();
    const stats = await localDataManager.getStats();
    
    res.json({ 
      total: estudiantes.length,
      estudiantes: estudiantes,
      estadisticas: stats
    });
    
  } catch (error) {
    console.error('Error consultando estudiantes:', error);
    res.status(500).json({ error: 'Error al consultar datos' });
  }
});

// Endpoint para descargar datos como CSV
app.get('/api/estudiantes/csv', (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const csvFile = path.join(__dirname, 'estudiantes_data.csv');
    
    if (fs.existsSync(csvFile)) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="estudiantes_chatbot_uss.csv"');
      
      const content = fs.readFileSync(csvFile, 'utf8');
      res.send(content);
    } else {
      res.status(404).json({ error: 'No hay datos disponibles' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al generar CSV' });
  }
});

// Endpoint del chat: intenta múltiples modelos de Gemini y devuelve el primer texto válido
app.post('/api/chat', async (req, res) => {
  try {
    // Espera un JSON { message: string, sessionId?: string } en el cuerpo de la solicitud
    const { message, sessionId = 'default' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }

    console.log(`🆔 SessionId recibido: ${sessionId}`);
    
    // Limpiar sesiones vencidas antes de procesar (limpieza inmediata)
    cleanExpiredSessions();
    
    // Verificar si es una sesión nueva
    const isNewSession = !studentSessions.has(sessionId);
    if (isNewSession) {
      console.log(`🆕 Nueva sesión iniciada: ${sessionId}`);
    }
    
    // Extraer datos del estudiante del mensaje actual
    console.log('🔍 Extrayendo datos del mensaje...');
    const newData = extractStudentData(message);
    
    // Obtener o crear sesión del estudiante
    let studentData = studentSessions.get(sessionId) || {};
    console.log('📋 Datos previos en sesión:', studentData);
    
    // Actualizar datos con nueva información
    studentData = { ...studentData, ...newData };
    console.log('📋 Datos actualizados:', studentData);
    studentSessions.set(sessionId, studentData);
    
    // Actualizar actividad de la sesión
    updateSessionActivity(sessionId);
    
    console.log(`📊 Sesiones activas: ${studentSessions.size}`);
    
    // Mantener historial de conversación
    let history = conversationHistory.get(sessionId) || [];
    history.push({ role: 'user', message: message });
    
    // Construir contexto con historial
    let contextWithHistory = contextoPrograma;
    
    // VERIFICAR PROBLEMAS DE FORMATO PRIMERO
    if (studentData.formatoIncorrecto && studentData.formatoIncorrecto.length > 0) {
      console.log('⚠️ Detectados problemas de formato, enviando mensaje de corrección');
      const correctionMessage = generateFormatCorrectionMessage(studentData);
      
      // Agregar mensaje de corrección al historial
      let history = conversationHistory.get(sessionId) || [];
      history.push({ role: 'assistant', message: correctionMessage });
      conversationHistory.set(sessionId, history);
      
      // Limpiar SOLO los datos con formato incorrecto, mantener la sesión
      delete studentData.formatoIncorrecto;
      // Limpiar campos mal formateados para permitir nueva entrada
      if (studentData.ciclo && !studentData.ciclo.match(/^\d{4}-[12]$/)) {
        delete studentData.ciclo;
      }
      studentSessions.set(sessionId, studentData);
      
      return res.json({ response: correctionMessage });
    }
    
    // Verificar si los datos están completos y cambiar comportamiento
    console.log('🔍 VERIFICANDO SI DATOS ESTÁN COMPLETOS...');
    const dataComplete = isDataComplete(studentData);
    console.log('✅ Resultado de verificación:', dataComplete);
    
    if (dataComplete) {
      console.log('🎯 DATOS COMPLETOS DETECTADOS - GUARDANDO INMEDIATAMENTE...');
      
      // Verificar si ya fue guardado antes (evitar duplicados)
      if (!studentData.yaGuardado) {
        // Determinar qué curso le corresponde
        studentData.cursoCorresponde = determinarCursoCorresponde(
          studentData.ultimoCurso,
          !message.toLowerCase().includes('no aprobé') && !message.toLowerCase().includes('no terminé')
        );
        
        // Guardar datos del estudiante (local + Google Sheets)
        console.log('💾 Iniciando guardado local...');
        localDataManager.saveStudentData(studentData).then(success => {
          if (success) {
            console.log(`💾✅ Datos guardados localmente: ${studentData.nombre}`);
          } else {
            console.log(`💾❌ Error guardando localmente: ${studentData.nombre}`);
          }
        });
        
        // Intentar guardar en Google Sheets
        console.log('📊 Iniciando guardado en Google Sheets...');
        try {
          sheetsManager.saveStudentData(studentData).then(sheetsSuccess => {
            if (sheetsSuccess) {
              console.log(`📊✅ Datos guardados en Google Sheets: ${studentData.nombre}`);
            } else {
              console.log(`📊❌ Error guardando en Google Sheets: ${studentData.nombre}`);
            }
          }).catch(err => {
            console.error('📊❌ Error completo de Google Sheets:', err.message);
          });
        } catch (err) {
          console.error('📊❌ Error en Google Sheets:', err.message);
        }
        
        // Marcar como guardado para evitar duplicados
        studentData.yaGuardado = true;
        studentSessions.set(sessionId, studentData);
        
        console.log(`✅ Proceso de guardado completado para: ${studentData.nombre}`);
      } else {
        console.log('ℹ️ Datos ya fueron guardados previamente para:', studentData.nombre);
      }
      
      // MODO POST-REGISTRO: Solo responder preguntas, no pedir más datos
      contextWithHistory += `\n\n🎯 MODO INFORMATIVO ACTIVO:
      
DATOS DEL ESTUDIANTE YA REGISTRADOS:
- Nombre: ${studentData.nombre}
- Ciclo: ${studentData.ciclo}
- Último curso: ${studentData.ultimoCurso}
- Correo: ${studentData.correo}

INSTRUCCIONES ESPECIALES:
- Los datos YA están completos, NO los vuelvas a pedir
- Solo responde preguntas específicas sobre el programa
- Proporciona información detallada cuando se solicite
- Actúa como un asistente informativo normal
- Mantén un tono profesional y servicial`;

    } else if (Object.keys(studentData).length > 0) {
      // Datos parciales: mostrar lo que falta
      contextWithHistory += `\n\nDATOS PARCIALES RECIBIDOS:`;
      if (studentData.nombre) contextWithHistory += `\n✅ Nombre: ${studentData.nombre}`;
      if (studentData.ciclo) contextWithHistory += `\n✅ Ciclo: ${studentData.ciclo}`;
      if (studentData.ultimoCurso) contextWithHistory += `\n✅ Último curso: ${studentData.ultimoCurso}`;
      if (studentData.correo) contextWithHistory += `\n✅ Correo: ${studentData.correo}`;
      
      const faltantes = [];
      if (!studentData.nombre) faltantes.push('nombre completo');
      if (!studentData.ciclo) faltantes.push('ciclo de egreso');
      if (!studentData.ultimoCurso) faltantes.push('último curso de computación');
      if (!studentData.correo) faltantes.push('correo institucional');
      
      contextWithHistory += `\n\n❌ AÚN FALTA: ${faltantes.join(', ')}`;
      contextWithHistory += `\nPide solo los datos faltantes, no repitas los que ya tienes.`;
    }
    
    // Agregar historial de conversación si existe
    if (history.length > 1) {
      contextWithHistory += `\n\nHISTORIAL DE CONVERSACIÓN:`;
      history.slice(-4).forEach((entry, index) => { // Solo últimos 4 mensajes
        contextWithHistory += `\n${entry.role === 'user' ? 'Usuario' : 'Asistente'}: ${entry.message}`;
      });
      contextWithHistory += `\n\nContinúa naturalmente con base en el historial anterior.`;
    }

    // Lista de modelos a probar en orden de preferencia (fallback progresivo)
    const modelsToTry = [
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent',
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent',
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent'
    ];

    let lastError = null;

    // Reintenta secuencialmente hasta que un modelo responda correctamente
    for (const modelUrl of modelsToTry) {
      try {
        // Solicitud directa a Gemini con el contexto del programa y el mensaje del usuario
        const response = await fetch(
          `${modelUrl}?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `${contextWithHistory}\n\nUsuario: ${message}\n\nAsistente:`
                }]
              }],
              generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
              }
            })
          }
        );

        const data = await response.json();

        // Extrae el primer candidato de texto retornado por Gemini si la respuesta es válida
        if (response.ok && data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
          const text = data.candidates[0].content.parts[0].text;
          console.log(`✅ Modelo funcionando: ${modelUrl}`);
          
          // Agregar respuesta del bot al historial
          let history = conversationHistory.get(sessionId) || [];
          history.push({ role: 'assistant', message: text });
          conversationHistory.set(sessionId, history);
          
          // Los datos ya se guardaron antes de generar la respuesta
          console.log('ℹ️ Respuesta generada, datos ya procesados anteriormente');
          
          return res.json({ response: text });
        }

        // Guarda el último error para reportarlo si todos los modelos fallan
        lastError = data.error?.message || 'Error desconocido';
      } catch (error) {
        // En caso de error de red o excepción, conservar el mensaje para diagnóstico posterior
        lastError = error.message;
        continue;
      }
    }

    // Si ningún modelo funcionó
    throw new Error(`No se pudo conectar con ningún modelo de Gemini. Último error: ${lastError}`);

  } catch (error) {
    console.error('Error en /api/chat:', error);
    res.status(500).json({ 
      error: 'Error al procesar la consulta',
      details: error.message 
    });
  }
});

// Iniciar servidor y Google Sheets
app.listen(PORT, async () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📡 Listo para recibir consultas del chatbot`);
  
  // Inicializar conexión con Google Sheets
  const sheetsConnected = await sheetsManager.initialize();
  if (sheetsConnected) {
    console.log(`📊 Google Sheets conectado correctamente`);
  } else {
    console.log(`⚠️  Google Sheets no disponible - usando backup local`);
  }
  
  // Limpiar sesiones viejas cada 2 minutos (más frecuente)
  setInterval(() => {
    console.log('🔄 Ejecutando limpieza automática de sesiones...');
    cleanExpiredSessions();
  }, 2 * 60 * 1000); // Cada 2 minutos
});

// Función para limpiar sesiones vencidas inmediatamente
function cleanExpiredSessions() {
  const fifteenMinutesAgo = Date.now() - (15 * 60 * 1000); // 15 minutos
  let cleaned = 0;
  
  for (const [sessionId, data] of studentSessions.entries()) {
    if (!data.lastActivity || data.lastActivity < fifteenMinutesAgo) {
      studentSessions.delete(sessionId);
      conversationHistory.delete(sessionId);
      cleaned++;
      console.log(`🧹 Sesión expirada limpiada: ${sessionId}`);
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 Total sesiones expiradas limpiadas: ${cleaned}`);
  }
}

// Función para actualizar actividad de sesión
function updateSessionActivity(sessionId) {
  const data = studentSessions.get(sessionId) || {};
  data.lastActivity = Date.now();
  data.createdAt = data.createdAt || Date.now(); // Marcar cuando se creó
  studentSessions.set(sessionId, data);
  
  console.log(`⏰ Actividad actualizada para sesión: ${sessionId}`);
}