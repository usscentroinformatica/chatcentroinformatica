// chat.js - Versión compatible con Gemini API pero con lógica de conversación natural y botones interactivos
const fetch = require('node-fetch');
require('dotenv').config();
const { db, admin } = require('./firebase'); // Inicializa Admin SDK y exporta admin
// Variables globales para sesiones (in-memory como fallback; principal es Firestore)
const conversationHistory = new Map();
const studentData = new Map(); // Fallback local, pero usa Firestore para persistencia
// Contenido del PDF (se mantiene igual que en el original)
const pdfContent = `PROGRAMA COMPUTACION PARA EGRESADOS
COMPUTACIÓN PARA EGRESADOS
DIRIGIDO A: Egresados de pregrado de la USS hasta el 2023-2 que tienen pendiente la acreditación en cursos de computación.
CONTENIDOS S/ 200 S/ 200 S/ 200 COMPUTACION 3 COMPUTACION 2 COMPUTACION 1 Microsoft Word (Intermedio - Avanzado) Microsoft Excel (Básico - Intermedio - Avanzado) IBM SPSS MS. Project
PROCESO DE REGISTRO (exacto de slides con números en círculo y nuevo texto):
Ingresa al campus USS:
1. Trámites.
2. PROGRAMACION DE SERVICIOS
3. PROGRAMA DE COMPUTACIÓN PARA EGRESADOS USS
4. Programar
5. Realizar el pago correspondiente.
6. Enviar comprobante de pago para registro a: centrodeinformatica@uss.edu.pe
Pasos para el Registro (para cualquier carrera):
- Reunir documentos del expediente (los que pide matrícula en línea).
- Ingresar a matrícula en línea y seleccionar:
  - Escuela Profesional: la tuya (ejemplo: Derecho, Contabilidad, Psicología, etc.).
  - Servicio: Programa de Computación para Egresados USS.
  - Cantidad: 1 (evitar duplicar).
  - Importe: S/ 200.
- Programar el servicio → se reflejará en tu Estado de Cuenta.
- Realizar el pago en cualquiera de las modalidades disponibles.
- Enviar comprobante de pago al correo: centrodeinformatica@uss.edu.pe
1. Accede a Procesos en Línea > Trámites > Programación de Servicios > PROGRAMA DE COMPUTACIÓN PARA EGRESADOS USS > Programar > Realizar el pago correspondiente > Enviar comprobante de pago para registro a: centrodeinformatica@uss.edu.pe.
2. Selecciona Escuela Profesional (elige la tuya).
3. Selecciona "Programa de Computación para Egresados USS" > Cantidad: 1 > Importe: S/200 > Nota: El servicio seleccionado se programará en tu Estado de Cuenta.
4. Presiona "Programar".
5. Realiza el pago correspondiente (ver formas de pago).
6. Envía comprobante de pago para registro a: centrodeinformatica@uss.edu.pe.
FORMAS DE PAGO (exactas de slides con iconos/números y nuevo texto):
1. Pagos con tarjeta - QR
2. Activar el check "He leído y estoy de acuerdo con las condiciones...
3. Yape - selecciona servicios programables ingresa el código de alumno.
4. Aplicativo BCP - Seleccionar Pagar servicios, en seleccionar servicios le coloca "Servicios Programables".. ingresa el código de alumno..
5. En cualquier agente o agencia del BCP (en caso soliciten número de cuenta: 305-1552328-0-87)
Desde la aplicación o agencia BCP la programación se reflejará entre 3 a 5 horas.
Desde agente BCP, se debe esperar hasta 24 horas para que se visualice la programación.
💳 Métodos de Pago
- Campus Virtual – Gestión Financiera: Pago online con Visa o MasterCard, Pago con billetera digital / QR
- Yape (ingresando tu código de alumno).
- Aplicativo BCP: Seleccionar: Servicios Programables, Ingresar tu código de alumno.
- Agente o Agencia BCP: Número de cuenta: 305-1552328-0-87
- Nota: Desde app/agencia: se refleja en 3 a 5 horas. Desde agente físico: hasta 24 horas.
- Campus Virtual: Gestión Financiera > Detalle Económico > Pagos con Tarjeta QR (VISA/Mastercard).
- Yape: [Paga el servicio programado vía app Yape ingresando código de alumno].
- Aplicativo BCP: Paga servicios > Selecciona "Servicios Programados" > Ingresa código > Refleja en 3-5 horas.
- Agente o Agencia BCP: En cualquier agente/agencia BCP (cuenta: 305-1552328-0-87 si solicitan). Desde agente, espera hasta 24 horas para visualizar la programación.
METODOLOGÍA DEL CURSO (con números en círculo y nuevo texto):
📚 Metodología del Curso
- Aula USS (www.aulauss.edu.pe) Plataforma virtual con todo el material.
- Material de autoaprendizaje PDFs y recursos disponibles en línea.
- 100% virtual Acceso 24/7 para avanzar a tu propio ritmo.
- Cuestionarios Evaluaciones progresivas para medir tu avance (4 cuestionarios, cada uno con 30 minutos de duración).
- Promedio final = (C1 + C2 + C3 + C4) / 4
1. AULA USS: Plataforma virtual donde encontrarás todo el material del curso. www.aulauss.edu.pe.
2. 100% VIRTUAL: Recursos disponibles 24/7, permite avanzar a tu propio ritmo.
3. MATERIAL DE AUTOAPRENDIZAJE: Disponibilidad en línea fomenta aprendizaje autodirigido.
4. CUESTIONARIOS: Miden progreso, identifican áreas de mejora y consolidan comprensión (4 cuestionarios, 30 min cada uno).
MATERIALES DEL CURSO: Sílabo, Material PDF, Cuestionarios.
EVALUACIÓN: PROMEDIO = (C1 + C2 + C3 + C4)/4 (4 cuestionarios, cada uno de 30 minutos). Cuestionario 1 -> C1, etc.
...Y entérate de nuestros eventos y capacitaciones. ¡Síguenos! en nuestras redes sociales... Centro de Informática USS @centrodeinformaticauss 986 724 506 Centro de Informática USS
GRACIAS 986 724 506 centrodeinformatica@uss.edu.pe PROGRAMA DE COMPUTACIÓN PARA EGRESADOS
INFORMACIÓN EXTRA: Deudas pendientes no afectan inscripción (independiente). Olvidé usuario/contraseña Campus/Aula: Contacta ciso.dti@uss.edu.pe o helpdesk1@uss.edu.pe. Constancias: acempresariales@uss.edu.pe. Cambio horarios: paccis@uss.edu.pe con pruebas.`;
// Configuración del contexto del Centro de Informática USS (MEJORADO)
const SYSTEM_CONTEXT = `Eres un asistente virtual amigable y conversacional del Centro de Informática USS en Chiclayo, Perú. Ayuda con el Programa de Computación para Egresados: sé preciso pero natural, como una conversación real. ANALIZA el PDF proporcionado para responder con información exacta.
INSTRUCCIONES CRÍTICAS:
- NUNCA uses palabras del mensaje del usuario como si fueran nombres de personas. Frases como "explicame el proceso" o "computacion 1" NO son nombres.
- IMPORTANTE: Cuando el usuario menciona "computacion 1", "computacion 2", etc., NO asumas automáticamente que ya completó ese curso; más bien entiende que está preguntando por ese curso específico.
- NO repitas exactamente la misma respuesta en turnos consecutivos.
- SI el usuario pide "explicame el proceso" o similar, responde con el proceso de inscripción, no con información general.
- Si el usuario pregunta por "computacion 1", explica los detalles de ese curso específico.
- Cuida la coherencia conversacional: verifica lo que el usuario ha dicho antes de responder.
- Los nombres verdaderos de personas suelen incluir apellidos (ej: "Miguel Maquen") y NO contienen palabras como: explicame, proceso, computacion, inscripción.
- Usa 'grado de bachiller' en lugar de 'título' cuando hables de la acreditación o propósito del programa.
En tus respuestas:
1. SÉ CONVERSACIONAL Y AMABLE - Como un asesor real, no un bot robótico.
2. PERSONALIZA según el nivel del estudiante - Si ya tiene Computación 1, reconócelo y enfoca en su progreso hacia Computación 2 y 3.
3. INFORMACIÓN GENERAL PRIMERO - No saltes directamente a pagos sin explicar el programa.
4. USA LENGUAJE NATURAL - Evita respuestas que suenen a plantillas.
5. RECONOCE LA PROGRESIÓN - Felicita por cursos completados y motiva a seguir.
IMPORTANTE:
- EXCLUSIVO para egresados pregrado hasta 2023-2 con pendiente en computación.
- Si ciclo > 2023-2: No elegible, redirige a paccis@uss.edu.pe.
- Deudas pendientes: No afectan inscripción; el programa es independiente de malla curricular.
- Olvidé usuario/contraseña Campus/Aula: Redirige a ciso.dti@uss.edu.pe o helpdesk1@uss.edu.pe.
- Constancias: Redirige a acempresariales@uss.edu.pe.
- Cambios horario/académicos: Redirige a paccis@uss.edu.pe (adjunta pruebas; revisa horarios para evitar cruces).
- NO info de otros servicios.
CONTENIDO DEL PDF "Guía Programa de Computación Egresados V2": ${pdfContent} [Usa SOLO esto para analizar y responder preguntas específicas, como detalles de módulos o evaluaciones. Si no está en PDF, usa info base abajo].
INFO BASE DEL PROGRAMA (EXACTA del PDF/slides con números en círculo y nuevo texto):
- Dirigido a: Egresados pregrado USS hasta 2023-2 con pendiente acreditación en cursos de computación.
- Modalidad: 100% virtual (Aula USS: www.aulauss.edu.pe), autoaprendizaje, 24/7, sin horarios fijos.
- LISTA DE CURSOS (siempre prominentemente en info general):
  📚 Computación 1: Microsoft Word (Intermedio - Avanzado) - S/ 200
  📚 Computación 2: Microsoft Excel (Básico - Intermedio - Avanzado) - S/ 200
  📚 Computación 3: IBM SPSS y MS Project - S/ 200
- Proceso de Registro (EXACTO de slides con números en círculo y nuevo texto):
  Ingresa al campus USS:
  1. Trámites.
  2. PROGRAMACION DE SERVICIOS
  3. PROGRAMA DE COMPUTACIÓN PARA EGRESADOS USS
  4. Programar
  5. Realizar el pago correspondiente.
  6. Enviar comprobante de pago para registro a: centrodeinformatica@uss.edu.pe
  - Nota: Usa credenciales existentes. Una vez registrado y pagado, accede al Aula USS. Niveles en paralelo OK. Completa antes 31/12.
- Formas de Pago (EXACTAS de slides con iconos y nuevo texto):
  1. Pagos con tarjeta - QR
  2. Activar el check "He leído y estoy de acuerdo con las condiciones...
  3. Yape - selecciona servicios programables ingresa el código de alumno.
  4. Aplicativo BCP - Seleccionar Pagar servicios, en seleccionar servicios le coloca "Servicios Programables".. ingresa el código de alumno..
  5. En cualquier agente o agencia del BCP (en caso soliciten número de cuenta: 305-1552328-0-87)
  Desde la aplicación o agencia BCP la programación se reflejará entre 3 a 5 horas.
  Desde agente BCP, se debe esperar hasta 24 horas para que se visualice la programación.
  💳 Métodos de Pago:
  - Campus Virtual – Gestión Financiera: Pago online con Visa o MasterCard, Pago con billetera digital / QR.
  - Yape: Ingresando tu código de alumno.
  - Aplicativo BCP: Seleccionar "Servicios Programables", Ingresar tu código de alumno.
  - Agente o Agencia BCP: Número de cuenta: 305-1552328-0-87. Nota: Desde app/agencia: 3 a 5 horas. Desde agente físico: hasta 24 horas.
  - Campus Virtual: Accede a Gestión Financiera > Detalle Económico > Pagos con Tarjeta QR (VISA/Mastercard).`;
// Función para extraer el ciclo del estudiante
function extractCicloInfo(message) {
  // Busca patrones como "202301", "2023-1", "2023 1", etc.
  const cicloRegex = /(?:20\d{2}[-\s]?[1-2])|(?:20\d{2}[01][1-2])/g;
  const matches = message.match(cicloRegex);
 
  if (matches && matches.length > 0) {
    let ciclo = matches[0].replace(/\s+|-/g, '');
    // Formatear a 2023-1 si es necesario
    if (ciclo.length === 6) {
      const year = ciclo.substring(0, 4);
      const period = ciclo.substring(4, 6);
      // Convierte 01/02 a 1/2
      const periodNum = parseInt(period, 10);
      ciclo = `${year}-${periodNum}`;
    }
    return ciclo;
  }
  return null;
}
// Función para extraer información del estudiante del mensaje
function extractStudentInfo(message) {
  const info = {};
 
  // Extraer ciclo
  info.ciclo = extractCicloInfo(message);
 
  // Extraer correo
  const emailRegex = /[a-zA-Z0-9._%+-]+@uss\.edu\.pe/i;
  const emailMatch = message.match(emailRegex);
  if (emailMatch) info.correo = emailMatch[0].toLowerCase();
 
  // Extraer nombre (asumiendo formato "nombre apellido")
  const nombreRegex = /(?:[a-zñáéíóú]+ [a-zñáéíóú]+(?:\s*[a-zñáéíóú]+)?)/i;
  const nombreMatch = message.match(nombreRegex);
 
  // Lista de palabras que NO deben ser consideradas nombres
  const palabrasNoNombres = ['explicame', 'explícame', 'explicar', 'proceso', 'computacion', 'computación',
                           'inscripcion', 'inscripción', 'informacion', 'información', 'registro', 'pago',
                           'pasos', 'como', 'cómo', 'ayuda', 'necesito', 'quiero', 'porfavor', 'por favor'];
 
  if (nombreMatch && nombreMatch[0].length > 5) {
    const posibleNombre = nombreMatch[0].toLowerCase();
   
    // Verificar que no sea uno de los términos prohibidos
    const esNoNombre = palabrasNoNombres.some(palabra => posibleNombre.includes(palabra));
   
    if (!esNoNombre) {
      info.nombre = nombreMatch[0];
    }
  }
 
  // Extraer número telefónico
  const phoneRegex = /\b9\d{8}\b|\b[7-9]\d{8}\b/;
  const phoneMatch = message.match(phoneRegex);
  if (phoneMatch) info.telefono = phoneMatch[0];
 
  // Extraer último curso (computacion 1/2/3)
  // IMPORTANTE: Solo extraer como "ultimoCurso" si explícitamente dice que ya lo completó
  const cursoRegex = /computaci[oó]n\s*[123]/i;
  const cursoMatch = message.match(cursoRegex);
 
  if (cursoMatch) {
    // Frases que indican que ya completó el curso
    const frasesCursoCompletado = ['ya llevé', 'ya lleve', 'ya completé', 'ya complete', 'terminé', 'termine',
                                 'aprobé', 'aprobe', 'he llevado', 'he completado', 'he terminado', 'he aprobado'];
   
    // Verificar si alguna de estas frases está en el mensaje
    const esCursoCompletado = frasesCursoCompletado.some(frase => message.toLowerCase().includes(frase));
   
    // Solo asignar como ultimoCurso si explícitamente dice que lo completó
    if (esCursoCompletado) {
      info.ultimoCurso = cursoMatch[0].toLowerCase();
    }
  }
 
  return info;
}
// Nueva función para detectar feedback (sí/no)
function detectFeedback(message) {
  const lowerMessage = message.toLowerCase().trim();
  const yesResponses = ['sí', 'si', 'yes', 'yep', 'ok', 'bueno', 'gracias'];
  const noResponses = ['no', 'nop', 'nope', 'mal', 'pésimo'];
  if (yesResponses.some(yes => lowerMessage.includes(yes))) {
    return 'positive';
  } else if (noResponses.some(no => lowerMessage.includes(no))) {
    return 'negative';
  }
  return null;
}
// Función para guardar feedback en Firestore (nueva colección 'feedbacks')
async function guardarFeedback(sessionId, feedbackType, currentData) {
  if (!feedbackType) return false;
 
  try {
    const docId = `${sessionId}_${Date.now()}`; // ID único por sesión y timestamp
    await db.collection('feedbacks').doc(docId).set({
      sessionId,
      feedbackType, // 'positive' o 'negative'
      nombre: currentData.nombre || 'Anónimo',
      correo: currentData.correo || 'No proporcionado',
      interactions: currentData.interactions || 0,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
   
    console.log(`✅ Feedback guardado: ${feedbackType} para sesión ${sessionId}`);
    return true;
  } catch (error) {
    console.error('❌ Error guardando feedback:', error);
    return false;
  }
}
// Función para determinar el siguiente curso recomendado
function getSiguienteCurso(cursoActual) {
  if (!cursoActual) return "Computación 1";
 
  const cursoNormalizado = cursoActual.toLowerCase().replace(/\s+/g, '');
 
  if (cursoNormalizado.includes("1")) {
    return "Computación 2";
  } else if (cursoNormalizado.includes("2")) {
    return "Computación 3";
  } else {
    return "Has completado todos los cursos del programa";
  }
}
// Función para verificar elegibilidad
function verificarElegibilidad(ciclo) {
  if (!ciclo) return true; // Si no hay ciclo, asumimos elegible
 
  try {
    // Normalizar formato a año-periodo (ej. 2023-1)
    let cicloNormalizado = ciclo;
    if (ciclo.length === 6) { // Si es formato 202301
      cicloNormalizado = `${ciclo.substring(0, 4)}-${parseInt(ciclo.substring(4, 6), 10)}`;
    }
   
    // Separar año y periodo
    const [year, period] = cicloNormalizado.split('-').map(part => parseInt(part, 10));
   
    // Verificar si es <= 2023-2
    return (year < 2023) || (year === 2023 && period <= 2);
  } catch (error) {
    console.error('❌ Error verificando elegibilidad:', error, ciclo);
    return true; // En caso de error, asumimos elegible
  }
}
// Función para cargar datos de estudiante desde Firestore
async function loadStudentData(sessionId) {
  try {
    // Intenta cargar de Firestore primero
    const docRef = db.collection('chatSessions').doc(sessionId);
    const doc = await docRef.get();
   
    if (doc.exists) {
      const data = doc.data();
      console.log('✅ Datos cargados de Firestore:', sessionId);
      return data;
    } else {
      // Si no existe en Firestore, busca en el Map local como fallback
      const localData = studentData.get(sessionId);
      if (localData) {
        console.log('✅ Datos cargados de Map local:', sessionId);
        return localData;
      }
      console.log('⚠️ Sesión nueva, iniciando:', sessionId);
      return { introSent: false, interactions: 0 };
    }
  } catch (error) {
    console.error('❌ Error cargando datos del estudiante:', error);
    // Fallback a Map local si hay error
    const localData = studentData.get(sessionId);
    if (localData) {
      console.log('✅ Fallback a Map local por error Firestore:', sessionId);
      return localData;
    }
    return { introSent: false, interactions: 0 };
  }
}
// Función para guardar datos del estudiante en Firestore
async function saveStudentData(sessionId, data) {
  try {
    // Guarda en Firestore
    await db.collection('chatSessions').doc(sessionId).set(data, { merge: true });
    console.log('✅ Datos guardados en Firestore:', sessionId);
   
    // También actualiza el Map local como cache/fallback
    studentData.set(sessionId, data);
    return true;
  } catch (error) {
    console.error('❌ Error guardando datos en Firestore:', error);
    // Al menos guarda en Map local como fallback
    studentData.set(sessionId, data);
    return false;
  }
}
// Función para guardar datos del estudiante en colección "estudiantes"
async function guardarDatosEstudiante(data) {
  if (!data.correo) return false;
 
  try {
    // Usar correo como ID para evitar duplicados
    const docId = data.correo.toLowerCase().replace(/[@.]/g, '_');
    await db.collection('estudiantes').doc(docId).set({
      nombre: data.nombre || 'No proporcionado',
      correo: data.correo,
      telefono: data.telefono || 'No proporcionado',
      ciclo: data.ciclo || 'No proporcionado',
      ultimoCurso: data.ultimoCurso || 'Ninguno',
      fechaRegistro: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
   
    console.log('✅ Estudiante registrado/actualizado en colección:', docId);
    return true;
  } catch (error) {
    console.error('❌ Error guardando estudiante en colección:', error);
    return false;
  }
}
// Exportar la función principal del chatbot
module.exports = async function handleChat(req, res) {
  try {
    console.log('📥 Solicitud recibida:', req.body);
   
    // Extraer datos de la solicitud
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Se requiere un mensaje' });
    }
   
    // Usar sessionId de la solicitud o generar uno nuevo
    const sessionId = req.body.sessionId || `session_${Date.now()}`;
   
    // Cargar datos del estudiante
    let currentData = await loadStudentData(sessionId);
   
    // Verificar si es la primera interacción
    const isFirstMessage = currentData.interactions === 0;
   
    // NUEVO: Para la PRIMERA interacción, envía pregunta de elegibilidad con BOTONES (no pide texto)
    if (isFirstMessage) {
      const response = '¡Hola! 😊 Soy el asistente del Programa de Computación para Egresados USS (exclusivo hasta 2023-2). Para ayudarte mejor, dime: ¿En qué año egresaste?';
      const options = [
        { text: 'Hasta 2023-2 (elegible para el programa)', value: 'hasta-2023-2' },
        { text: '2024 o posterior (no elegible)', value: '2024-o-posterior' }
      ];
      currentData.interactions = 1;
      await saveStudentData(sessionId, currentData);
      return res.status(200).json({
        response,
        options,
        sessionId,
        studentData: currentData,
        isEligible: null  // Pendiente
      });
    }

    // NUEVO: Procesar selección de botón (si message es un value de opción)
    if (message === 'hasta-2023-2') {
      currentData.elegible = true;
      currentData.ciclo = '2023-2 o anterior';
      await saveStudentData(sessionId, currentData);
      const response = '¡Genial! 😊 Eres elegible. El programa es 100% virtual (S/200 por curso). 📚 Opciones: Computación 1 (Word), 2 (Excel), 3 (SPSS/Project). ¿Qué necesitas? (Ej: pasos de inscripción, pagos).';
      const options = [
        { text: 'Pasos de inscripción', value: 'inscripcion' },
        { text: 'Formas de pago', value: 'pagos' },
        { text: 'Detalles de cursos', value: 'cursos' },
        { text: 'Evaluación y metodología', value: 'evaluacion' }
      ];
      return res.status(200).json({
        response,
        options,
        sessionId,
        studentData: currentData,
        isEligible: true
      });
    } else if (message === '2024-o-posterior') {
      currentData.elegible = false;
      currentData.ciclo = '2024 o posterior';
      await saveStudentData(sessionId, currentData);
      const response = 'Lo siento 😔, el programa es solo para egresados hasta 2023-2. Contacta a paccis@uss.edu.pe para alternativas. ¿Otra duda?';
      return res.status(200).json({
        response,
        options: null,  // Sin botones
        sessionId,
        studentData: currentData,
        isEligible: false
      });
    }

    // Detectar si este mensaje es un feedback (sí/no)
    const feedbackType = detectFeedback(message);
    let feedbackHandled = false;
    if (feedbackType) {
      await guardarFeedback(sessionId, feedbackType, currentData);
      feedbackHandled = true;
      console.log(`🎯 Feedback detectado y guardado: ${feedbackType}`);
    }
   
    // Extraer información del mensaje (solo si no es puro feedback y no es botón)
    const extractedInfo = (feedbackHandled || ['hasta-2023-2', '2024-o-posterior', 'inscripcion', 'pagos', 'cursos', 'evaluacion'].includes(message)) ? {} : extractStudentInfo(message);
    console.log('📊 Información extraída:', extractedInfo);
   
    // Actualizar datos con la nueva información extraída
    currentData = {
      ...currentData,
      ...extractedInfo,
      introSent: true, // Marcar que se envió la intro
      lastMessage: message,
      lastUpdate: new Date().toISOString()
    };
   
    // Verificar elegibilidad basado en ciclo
    if (currentData.ciclo) {
      currentData.elegible = verificarElegibilidad(currentData.ciclo);
      if (!currentData.elegible) {
        const response = `Lo siento ${currentData.nombre || ''}, el Programa de Computación para Egresados está disponible solo para estudiantes hasta el ciclo 2023-2. Para tu caso particular, te recomiendo contactar directamente a paccis@uss.edu.pe para recibir orientación sobre tus opciones.
Para más consultas o trámites, contacta al 📞 986 724 506 o 📧 centrodeinformatica@uss.edu.pe.`;
       
        await saveStudentData(sessionId, currentData);
        return res.status(200).json({
          response,
          options: null,
          sessionId,
          studentData: currentData,
          isEligible: false
        });
      }
    }
   
    // Guardar datos actualizados
    await saveStudentData(sessionId, currentData);
   
    // Preparar contexto para la IA
    let conversationContext = '';
   
    // Si es feedback, agregar contexto para que la IA lo reconozca y responda naturalmente
    if (feedbackHandled) {
      const feedbackText = feedbackType === 'positive' ? 'sí' : 'no';
      conversationContext = `[El usuario acaba de responder al feedback con "${feedbackText}". Reconoce su respuesta de manera amigable (ej: "¡Gracias por tu feedback positivo!" o "Lo siento si no fue lo que esperabas, ¿cómo puedo mejorar?"), y luego continúa con la conversación normal si hay más contexto, o pregunta si tiene más dudas.]`;
    }
    // Si el mensaje es "explicame el proceso" o similar
    else if (message.toLowerCase().includes('explicame') || message.toLowerCase().includes('explícame') ||
            message.toLowerCase().includes('proceso') || message.toLowerCase().includes('pasos') ||
            message.toLowerCase().includes('cómo me inscribo') || message.toLowerCase().includes('como me inscribo') ||
            message === 'inscripcion') {
     
      conversationContext = `[El usuario está pidiendo que le expliques el PROCESO DE INSCRIPCIÓN. NO trates "explicame el proceso" como un nombre. Proporciona los pasos detallados para inscribirse: 1) Ingresar al campus USS, 2) Ir a Trámites, etc. Incluye también información sobre los métodos de pago disponibles. Sé claro y directo.]`;
    }
    // Si el mensaje menciona computacion 1, 2 o 3
    else if (message.toLowerCase().includes('computacion 1') || message.toLowerCase().includes('computación 1') ||
            message.toLowerCase() === 'computacion1' || message.toLowerCase() === 'computación1' || message.toLowerCase() === '1' ||
            message === 'cursos') {
     
      conversationContext = `[El usuario está preguntando sobre el curso "Computación 1" (Microsoft Word). NO asumas que ya lo ha completado a menos que explícitamente lo haya mencionado antes. Proporciona información detallada sobre el contenido de este curso específico, su metodología y costo (S/ 200). Sé conversacional y amigable.]`;
    }
    else if (message.toLowerCase().includes('computacion 2') || message.toLowerCase().includes('computación 2') ||
            message.toLowerCase() === 'computacion2' || message.toLowerCase() === 'computación2' || message.toLowerCase() === '2') {
     
      conversationContext = `[El usuario está preguntando sobre el curso "Computación 2" (Microsoft Excel). NO asumas que ya lo ha completado a menos que explícitamente lo haya mencionado antes. Proporciona información detallada sobre el contenido de este curso específico, su metodología y costo (S/ 200). Sé conversacional y amigable.]`;
    }
    else if (message.toLowerCase().includes('computacion 3') || message.toLowerCase().includes('computación 3') ||
            message.toLowerCase() === 'computacion3' || message.toLowerCase() === 'computación3' || message.toLowerCase() === '3') {
     
      conversationContext = `[El usuario está preguntando sobre el curso "Computación 3" (IBM SPSS y MS Project). NO asumas que ya lo ha completado a menos que explícitamente lo haya mencionado antes. Proporciona información detallada sobre el contenido de este curso específico, su metodología y costo (S/ 200). Sé conversacional y amigable.]`;
    }
    // Si el mensaje es "si" o "si porfavor" después de dar datos
    else if ((message.toLowerCase() === 'si' || message.toLowerCase() === 'sí' ||
             message.toLowerCase().includes('si porfavor') || message.toLowerCase().includes('sí por favor')) &&
             (currentData.nombre || currentData.correo)) {
     
      // Si ya completó algún curso, personalizar respuesta
      if (currentData.ultimoCurso) {
        const siguienteCurso = getSiguienteCurso(currentData.ultimoCurso);
       
        conversationContext = `[El usuario ha confirmado que quiere información. Dado que ya ha completado ${currentData.ultimoCurso}, felicítalo por su avance y recomiéndale inscribirse en ${siguienteCurso}. Explícale brevemente el contenido de ${siguienteCurso} y pregúntale si desea saber más sobre el contenido o el proceso de inscripción. Sé conversacional y motivador.]`;
      } else {
        // Contexto para responder a "sí, quiero información general"
        conversationContext = `[El usuario ha confirmado que quiere información general del Programa de Computación para Egresados. Proporciona primero información sobre los tres cursos disponibles (Computación 1, 2 y 3) y sus contenidos. NO pases directamente a los pasos de pago sin antes explicar el programa completo. Pregunta al final si desea conocer el proceso de inscripción. Sé conversacional y natural.]`;
      }
    }
    // Para cualquier otra interacción
    else {
      // Contexto general con los datos del estudiante
      conversationContext = `[El usuario ha enviado el mensaje: "${message}". Tiene estos datos: ${currentData.nombre ? 'nombre: ' + currentData.nombre : 'sin nombre'}, ${currentData.correo ? 'correo: ' + currentData.correo : 'sin correo'}, ${currentData.telefono ? 'teléfono: ' + currentData.telefono : 'sin teléfono'}, ciclo: ${currentData.ciclo || 'desconocido'}, curso actual: ${currentData.ultimoCurso || 'ninguno'}.
     
      Si ya ha mencionado que completó algún curso (${currentData.ultimoCurso || 'ninguno'}), personaliza tu respuesta refiriéndote a ello y recomienda el siguiente curso. Recuerda: NO interpretes mensajes como "explicame el proceso" o "computacion 1" como nombres de personas. Sé conversacional y natural, evitando respuestas repetitivas.]`;
    }
   
    // Obtener historial de conversación
    let history = conversationHistory.get(sessionId) || [];
   
    // Limitar historial a últimas 10 interacciones para evitar tokens excesivos
    if (history.length > 20) {
      history = history.slice(-20);
    }
   
    // Convertir a formato de Gemini
    const historyFormatted = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));
   
    // Modelos a intentar en orden de preferencia (actualizado con versiones 2.5 y 2.0 para mayor naturalidad)
    // Enlaces de referencia para Gemini API:
    // - Docs oficiales: https://ai.google.dev/gemini-api/docs/models/gemini
    // - Modelos 2.5: https://ai.google.dev/gemini-api/docs/models/gemini-2-5 (disponible en Oct 2025)
    // - Configuración de API Key: https://ai.google.dev/gemini-api/docs/api-key
    const models = [
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite'
    ];
   
    let botResponse = null;
    let options = null;  // Por defecto, sin botones
    let lastError = null;
   
    // Intentar cada modelo hasta obtener respuesta
    for (const model of models) {
      try {
        console.log(`🔄 Intentando con modelo: ${model}`);
       
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: SYSTEM_CONTEXT }]
                },
                {
                  role: 'model',
                  parts: [{ text: 'Entendido. Seré un asistente virtual amigable y conversacional del Centro de Informática USS, enfocado en el Programa de Computación para Egresados. Personalizaré mis respuestas según el nivel del estudiante, seré natural en mi comunicación y proporcionaré información relevante y útil. Nunca confundiré frases como "explicame el proceso" o "computacion 1" con nombres de personas.' }]
                },
                ...historyFormatted,
                {
                  role: 'user',
                  parts: [{ text: `${conversationContext}\n\nMensaje del usuario: ${message}\n\nResponde natural y fluido. Si procede, sugiere opciones como 'inscripcion', 'pagos', etc., pero NO pidas datos por texto (usa botones en frontend).` }]
                }
              ],
              generationConfig: {
                temperature: 0.7, // Para naturalidad en conversaciones; baja a 0.5 si quieres más consistencia
                maxOutputTokens: 600,
                topP: 0.8,
                topK: 40
              },
              safetySettings: [
                {
                  category: 'HARM_CATEGORY_HARASSMENT',
                  threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                },
                {
                  category: 'HARM_CATEGORY_HATE_SPEECH',
                  threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                },
                {
                  category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                  threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                },
                {
                  category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                  threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                }
              ]
            })
          }
        );
        if (response.ok) {
          const data = await response.json();
          if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text) {
            botResponse = data.candidates[0].content.parts[0].text.trim();
            if (botResponse.length < 50) {
              console.log(`⚠️ Respuesta muy corta con ${model} (longitud: ${botResponse.length}), probando siguiente modelo.`);
              continue;
            }
            console.log(`✅ Respuesta obtenida del modelo: ${model} (longitud: ${botResponse.length} caracteres). ¡Más natural y fluida!`);
            break;
          } else {
            console.log(`⚠️ Estructura de respuesta inválida de ${model}.`);
          }
        } else {
          const errorText = await response.text();
          console.log(`❌ Error HTTP con ${model} (código ${response.status}): ${errorText.substring(0, 200)}...`);
          lastError = errorText;
        }
      } catch (error) {
        console.log(`❌ Error de conexión con ${model}: ${error.message}`);
        lastError = error.message;
      }
    }
    // Si ningún modelo funciona, usar respuestas de fallback personalizadas
    if (!botResponse || botResponse.length < 50) {
      console.log('⚠️ Usando fallback: Todos los modelos fallaron. Último error:', lastError);
     
      // Respuestas de fallback según el contexto del mensaje
      if (message.toLowerCase().includes('explicame') || message.toLowerCase().includes('explícame') ||
          message.toLowerCase().includes('proceso') || message.toLowerCase().includes('pasos') ||
          message === 'inscripcion') {
        // Fallback para proceso de inscripción
        botResponse = `Para inscribirte en el Programa de Computación para Egresados, sigue estos pasos:
1. Ingresa al Campus USS con tus credenciales.
2. Ve a la sección de "Trámites".
3. Selecciona "PROGRAMACION DE SERVICIOS".
4. Busca y elige la opción "PROGRAMA DE COMPUTACIÓN PARA EGRESADOS USS".
5. Haz clic en "Programar".
6. Realiza el pago de S/ 200 por el curso que deseas llevar.
7. Envía el comprobante de pago a centrodeinformatica@uss.edu.pe.
Puedes pagar mediante: Campus Virtual (tarjeta o QR), Yape (servicios programables), Aplicativo BCP, o Agente BCP (cuenta: 305-1552328-0-87).
¿En cuál de los cursos estás interesado?
Para más consultas o trámites, contacta al 📞 986 724 506 o 📧 centrodeinformatica@uss.edu.pe.`;
      }
      else if (message.toLowerCase().includes('computacion 1') || message.toLowerCase().includes('computación 1')) {
        // Fallback para Computación 1
        botResponse = `En Computación 1 aprenderás Microsoft Word a nivel intermedio y avanzado, incluyendo:
- Formato y edición avanzada de documentos
- Estilos y plantillas profesionales
- Tablas de contenido e índices
- Control de cambios y trabajo colaborativo
- Combinación de correspondencia
El curso tiene un costo de S/ 200 y se evalúa mediante 4 cuestionarios de 30 minutos cada uno, con acceso 24/7 en la plataforma Aula USS.
¿Te gustaría inscribirte en este curso o necesitas información sobre el proceso?
Para más consultas o trámites, contacta al 📞 986 724 506 o 📧 centrodeinformatica@uss.edu.pe.`;
      }
      else if (currentData.ultimoCurso) {
        // Personalizar fallback según el progreso del estudiante
        const siguienteCurso = getSiguienteCurso(currentData.ultimoCurso);
       
        botResponse = `¡Hola! 😊
Veo que ya has completado ${currentData.ultimoCurso}. ¡Felicitaciones por tu avance! 👏
Para continuar con el Programa de Computación para Egresados, te recomiendo inscribirte en ${siguienteCurso}. Cada curso tiene un costo de S/ 200.
¿Te gustaría conocer más detalles sobre los contenidos de este curso o prefieres que te explique el proceso de inscripción?
Para más consultas o trámites, contacta al 📞 986 724 506 o 📧 centrodeinformatica@uss.edu.pe.`;
      }
      else if (currentData.introSent) {
        // Fallback general (corregido para usar "grado de bachiller")
        botResponse = `¡Hola! Sí, es correcto, el programa consta de 3 cursos en total: Computación 1 (Microsoft Word), Computación 2 (Microsoft Excel) y Computación 3 (IBM SPSS y MS Project). Estos cursos están diseñados para ayudarte a acreditar los conocimientos de computación que necesitas para obtener tu grado de bachiller.
Todos los cursos son 100% virtuales a través del Aula USS, con material disponible 24/7 para que avances a tu propio ritmo.
¿Tienes alguna duda sobre el contenido de alguno de los cursos o sobre el proceso para inscribirte?
Para más consultas o trámites, contacta al 📞 986 724 506 o 📧 centrodeinformatica@uss.edu.pe.`;
      } else {
        // Fallback para primera interacción (no se usa ya que se maneja con botones)
        botResponse = `¡Hola! 👋 Bienvenido al Centro de Informática de la Universidad Señor de Sipán. Soy tu asistente virtual y estoy aquí para ayudarte con el Programa de Computación para Egresados.
Para ayudarte mejor, ¿podrías proporcionarme algunos datos?
- Tu nombre completo
- Correo institucional
- Número telefónico
- Y si has llevado algún curso de computación (Computación 1, 2 o ninguno)
Una vez que tenga esta información, podré orientarte mejor sobre tus opciones.`;
      }
    }
    // Agregar pregunta de feedback al final de cada respuesta (excepto si es la primera interacción o puro feedback)
    if (currentData.interactions > 1 && !feedbackHandled) {
      botResponse += `\n\n¿Te gustó esta respuesta? Di 'sí' o 'no' para ayudarnos a mejorar. 😊`;
    }
    // Si es feedback, agregar un acknowledgment al inicio de la respuesta generada
    if (feedbackHandled) {
      const ack = feedbackType === 'positive'
        ? '¡Gracias por tu feedback positivo! Me alegra que te haya sido útil. '
        : 'Lo siento si no fue lo que esperabas. ¿Cómo puedo ayudarte mejor? ';
      botResponse = ack + botResponse;
    }
    // Guardar conversación
    let updatedHistory = conversationHistory.get(sessionId) || [];
    updatedHistory.push({ role: 'user', content: message });
    updatedHistory.push({ role: 'assistant', content: botResponse });
   
    // Limitar historial a últimas 30 interacciones
    if (updatedHistory.length > 30) {
      updatedHistory = updatedHistory.slice(-30);
    }
   
    conversationHistory.set(sessionId, updatedHistory);
    // Actualizar interacciones
    currentData.interactions = (currentData.interactions || 0) + 1;
    // Guardar estado actualizado en Firestore
    await saveStudentData(sessionId, currentData);
    // Guardar estudiante solo si datos completos y no se ha guardado antes
    if (currentData.nombre && currentData.correo && !currentData.studentSaved) {
      await guardarDatosEstudiante(currentData);
      currentData.studentSaved = true;
      await saveStudentData(sessionId, currentData);
    }
    console.log('✅ Respuesta enviada (sesión persistida, longitud:', botResponse.length, ')');
    return res.status(200).json({
      response: botResponse,
      options,  // Nulo por defecto; backend lo setea cuando quiere botones
      sessionId,
      studentData: currentData,
      isEligible: currentData.elegible !== false
    });
  } catch (error) {
    console.error('❌ Error en el servidor:', error);
   
    const sessionId = req.body?.sessionId || 'default';
    let currentData = {}; // Fallback vacío
   
    try {
      currentData = await loadStudentData(sessionId); // Intenta cargar si existe
    } catch (loadErr) {
      console.error('❌ Error cargando en catch:', loadErr);
    }
   
    // Respuesta de error más natural y conversacional
    const errorResponse = currentData.nombre
      ? `¡Hola ${currentData.nombre}! Parece que estamos teniendo un pequeño problema técnico en este momento. ¿Podrías intentarlo de nuevo en unos instantes? Si tienes una consulta urgente, te recomiendo contactar directamente al Centro de Informática al 📞 986 724 506 o por correo a 📧 centrodeinformatica@uss.edu.pe.`
      : `¡Hola! Estamos experimentando algunas dificultades técnicas temporales. Por favor, intenta de nuevo en unos momentos. Si necesitas asistencia inmediata, contacta al Centro de Informática al 📞 986 724 506 o por correo a 📧 centrodeinformatica@uss.edu.pe.`;
   
    // Intenta guardar en catch si hay datos
    if (sessionId && currentData) {
      await saveStudentData(sessionId, currentData);
    }
   
    return res.status(500).json({
      error: 'Error interno del servidor',
      response: errorResponse,
      options: null
    });
  }
};
