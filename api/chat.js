// Servidor Express para el Chatbot USS - Centro de Informática
// Programa de Computación para Egresados con validación de elegibilidad
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { PDFParse } = require('pdf-parse'); // Corregido: API de pdf-parse v2.x
require('dotenv').config();
const fs = require('fs'); // Para verificar archivo PDF
const db = require('./firebase');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware (MEJORADO: CORS configurado para local - permite localhost:3000)
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://chatcentroinformatica.vercel.app'  // Tu domain de Vercel (ajusta si cambia)
    : 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());  // Para parsear JSON en requests

// Variables para almacenar sesiones temporalmente en memoria
const conversationHistory = new Map();
const studentData = new Map();

// Contenido del PDF (se cargará al inicio)
let pdfContent = '';

// Función para cargar y analizar el PDF al inicio del servidor (VERSIÓN MEJORADA PARA VERCEL)
// Embed del fallback como default para evitar issues con fs en serverless. Solo usa fs en local si el archivo existe.
async function loadPdfContent() {
  const pdfPath = './Guía Programa de Computación Egresados V2.pdf'; // Ajusta si el nombre exacto varía

  // Default: Usa el contenido embebido (fallback completo) – optimizado para producción (Vercel)
  pdfContent = `PROGRAMA COMPUTACION PARA EGRESADOS

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
  
  console.log('✅ Usando contenido embebido del PDF (optimizado para Vercel/prod).');

  // Opcional: En desarrollo local, intenta cargar el PDF real si existe (para testing)
  if (process.env.NODE_ENV !== 'production' && fs.existsSync(pdfPath)) {
    let parser = null;
    try {
      const dataBuffer = fs.readFileSync(pdfPath);
      parser = new PDFParse({ data: dataBuffer });
      const pdfData = await parser.getText();
      pdfContent = pdfData.text;
      console.log('✅ PDF cargado desde archivo local. Longitud del texto:', pdfContent.length);
      
      // Resumir si es muy largo para el prompt (límite ~4000 tokens ~8000 chars)
      if (pdfContent.length > 8000) {
        pdfContent = pdfContent.substring(0, 8000) + '\n\n[Texto truncado: El PDF completo incluye guías detalladas de inscripción, contenidos de cursos y evaluaciones. Usa secciones clave para responder.]';
        console.log('📝 PDF resumido para optimizar contexto de IA.');
      }
      
      // Extraer secciones clave para mejorar "aprendizaje" (ej. FAQs o resúmenes)
      const keySections = {
        cursos: pdfContent.match(/Computación \d+.*?S\/200/gmi) || [],
        inscripcion: pdfContent.match(/Proceso de Registro|Inscripción.*?comprobante/gmi) || [],
        evaluacion: pdfContent.match(/Evaluación|Cuestionarios.*?promedio/gmi) || []
      };
      console.log('🔑 Secciones clave extraídas:', Object.keys(keySections).filter(k => keySections[k].length > 0));
    } catch (err) {
      console.error('❌ Error al procesar PDF local:', err.message);
      // Mantiene el embed como fallback
    } finally {
      if (parser) {
        await parser.destroy(); // Liberar memoria
      }
    }
  } else if (process.env.NODE_ENV !== 'production') {
    console.log('ℹ️  En desarrollo: PDF no encontrado en', pdfPath, '– usando embed.');
  }
}

// Función para extraer datos del estudiante (MEJORADA: Más robusta, evita falsos positivos y maneja mejor el parsing)
function extractStudentData(message) {
  const data = {};
  const issues = [];

  // Limpiar y normalizar mensaje
  const normalized = message.toLowerCase().replace(/[^\w\s@\-.:]/g, ' ').trim();

  // Extraer nombre (busca frases con al menos 2 palabras, sin números/emails/teléfonos)
  const nombreCandidates = normalized.split(/\s+/).filter(word => !word.match(/^\d/)).join(' ').match(/\b[a-záéíóúüñ]{3,}\s+[a-záéíóúüñ]{3,}\b/i);
  if (nombreCandidates && nombreCandidates[0].split(' ').length >= 2) {
    data.nombre = nombreCandidates[0].charAt(0).toUpperCase() + nombreCandidates[0].slice(1);
  }

  // Extraer correo
  const correoMatch = message.match(/([a-zA-Z0-9._%+-]+@(?:uss\.edu\.pe|crece\.uss\.edu\.pe))/i);
  if (correoMatch) {
    data.correo = correoMatch[1].toLowerCase();
  }

  // Extraer teléfono (peruano: 9xxxxxxxx)
  const telefonoMatch = message.match(/(9\d{8})/);
  if (telefonoMatch) {
    data.telefono = telefonoMatch[1];
  }

  // Extraer ciclo/año de egreso
  const cicloMatch = message.match(/(\d{4}-[12])/i);
  if (cicloMatch) {
    data.ciclo = cicloMatch[1].toUpperCase();
    data.año_egreso = data.ciclo;
    const [year, semester] = data.ciclo.split('-');
    const yearNum = parseInt(year);
    const semesterNum = parseInt(semester);
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
    data.ultimoCurso = cursoMatch[1].toLowerCase() === 'ninguno' ? 'ninguno' : `Computación ${cursoMatch[1]}`;
  }

  if (issues.length > 0) {
    data.issues = issues;
  }

  return data;
}

// Configuración del contexto del Centro de Informática USS (ACTUALIZADO: Integra PDF EXACTO con slides/imágenes y nuevo texto, enfocado en números en círculo para proceso y pagos. CORREGIDO: Pasos exactos de registro y pagos con detalles de matrícula en línea, documentos, etc. Agregado: 4 cuestionarios de 30 min cada uno en evaluación/metodología)
const SYSTEM_CONTEXT = `Eres un asistente virtual del Centro de Informática USS en Chiclayo, Perú. Ayuda SOLO con el Programa de Computación para Egresados: sé preciso, corto y enfocado en la pregunta. ANALIZA el PDF proporcionado para responder con info exacta (ej. contenidos específicos de cursos, pasos detallados de inscripción y pago con números en círculo). Si es consulta general, lista cursos y costos upfront, explica pago/registro brevemente, y pregunta ciclo/nombre SOLO si quieren inscribirse. Usa info del PDF como fuente principal. NO textos largos; 100-200 palabras max. Al final de cada respuesta, agrega: "Para más consultas o trámites, contacta al 📞 986 724 506 o 📧 centrodeinformatica@uss.edu.pe".

IMPORTANTE: 
- EXCLUSIVO para egresados pregrado hasta 2023-2 con pendiente en computación.
- Si ciclo > 2023-2: No elegible, redirige a paccis@uss.edu.pe.
- Deudas pendientes: No afectan inscripción; el programa es independiente de malla curricular.
- Olvidé usuario/contraseña Campus/Aula USS: Redirige a ciso.dti@uss.edu.pe o helpdesk1@uss.edu.pe.
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
  - Campus Virtual: Accede a Gestión Financiera > Detalle Económico > Pagos con Tarjeta QR (VISA/Mastercard).
  - Yape: Paga el servicio programado vía app Yape (ingresa código del alumno).
  - Aplicativo BCP: Paga servicios > "Servicios Programados" > Ingresa código > Refleja en 3-5 horas.
  - Agente o Agencia BCP: En cualquier agente/agencia BCP (cuenta: 305-1552328-0-87). Espera hasta 24 horas.
- Metodología (con números en círculo y nuevo texto): 📚 Metodología del Curso: Aula USS (www.aulauss.edu.pe), Material de autoaprendizaje PDFs y recursos en línea, 100% virtual Acceso 24/7, Cuestionarios evaluaciones progresivas (4 cuestionarios, 30 min cada uno), Promedio = (C1 + C2 + C3 + C4)/4. 1. Aula USS. 2. 100% Virtual (24/7). 3. Material Autoaprendizaje. 4. Cuestionarios.
- Materiales: Sílabo, Material PDF, Cuestionarios.
- Evaluación: Promedio = (C1 + C2 + C3 + C4)/4 (4 cuestionarios, cada uno de 30 minutos; Cuestionario 1 -> C1, etc.).
- Contactos: centrodeinformatica@uss.edu.pe | 986 724 506 | @centrodeinformaticauss (IG), Centro de Informática USS (FB/LinkedIn). Sigue para eventos.

EJEMPLOS CORTOS (basados en PDF/slides con números):
- Invitación: "¡Hola! 👋 Programa 100% virtual para egresados hasta 2023-2. 📚 Cursos: 1-Word (Int-Av) S/200; 2-Excel (Bás-Int-Av) S/200; 3-SPSS/Project S/200. Registro: Ingresa Campus > 1. Trámites > 2. Programación Servicios > 3. Programa Computación Egresados USS > 4. Programar > 5. Paga > 6. Envía comprobante a centrodeinformatica@uss.edu.pe. ¿Tu ciclo? 📞 986 724 506."
- Pagos: "💳 Pasos pagos: 1. Tarjeta QR (activa check condiciones). 2. Yape (servicios programables, código alumno). 3. BCP App (Pagar servicios > Programables, código). 4. Agente BCP (cta 305-1552328-0-87, 24h). App/agencia: 3-5h. 📧 centrodeinformatica@uss.edu.pe."
- Inscripción: "Pasos registro: 1. Campus > Trámites. 2. Programación Servicios. 3. Programa Computación Egresados USS. 4. Programar (S/200). 5. Paga. 6. Envía comprobante. 📞 986 724 506."
- Evaluación: "Evaluación: 4 cuestionarios (30 min cada uno), promedio (C1+C2+C3+C4)/4. 📧 centrodeinformatica@uss.edu.pe."
- Deudas: "¡No hay problema! 😊 El programa es independiente; deudas de malla no afectan. Sigue pasos de registro. 📧 centrodeinformatica@uss.edu.pe."
- Credenciales: "Para recuperar usuario/contraseña, contacta ciso.dti@uss.edu.pe o helpdesk1@uss.edu.pe. 📞 986 724 506."
- Constancias: "Para constancias, contacta acempresariales@uss.edu.pe. 📞 986 724 506."
- Cambios: "Para cambio de horarios, envía solicitud con pruebas a paccis@uss.edu.pe. Revisa para evitar cruces. 📧 centrodeinformatica@uss.edu.pe."

PERSONALIDAD: Profesional, amigable, emojis. Responde en español. Mantén conversaciones naturales y fluidas, sin repetir información ya dada en el historial.`;

function datosFaltantes(data) {
  const faltan = [];
  if (!data.nombre) faltan.push('nombre completo');
  if (!data.correo) faltan.push('correo institucional');
  if (!data.telefono) faltan.push('número telefónico');
  if (!data.año_egreso) faltan.push('año de egreso (ej: 2022-1)');
  if (!data.ultimoCurso) faltan.push('curso de computación actual (ej: Computación 2 o ninguno)');
  return faltan;
}

app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId = 'default' } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }

    // Extraer datos del estudiante del mensaje actual
    const extractedData = extractStudentData(message);
    let currentData = studentData.get(sessionId) || {};
    currentData = { ...currentData, ...extractedData };
    currentData.lastActivity = Date.now();
    studentData.set(sessionId, currentData);

    // MEJORA: Verificar si ya se pidió datos en esta sesión (evita repetición)
    const hasAskedForData = currentData.hasAskedForData || false;
    const faltan = datosFaltantes(currentData);

    // Solo pide datos si faltan MÁS DEL 50% y no se ha pedido antes (o si es primera interacción)
    if (faltan.length > 2 && (!hasAskedForData || currentData.interactions < 2)) {
      currentData.hasAskedForData = true;
      currentData.interactions = (currentData.interactions || 0) + 1;
      studentData.set(sessionId, currentData);

      return res.status(200).json({
        response: `¡Hola! 😊 Para ayudarte mejor con el Programa de Computación para Egresados, necesito algunos datos. Envía solo lo que falta, cada uno en una línea:\n\n- ${faltan.join('\n- ')}\n\nEjemplo:\n- Nombre: Juan Pérez\n- Correo: juan@uss.edu.pe\n\nUna vez que los tengas, continuamos. 📚`,
        sessionId,
        studentData: currentData,
        isEligible: false
      });
    }

    // Si faltan pocos, pregunta progresivamente en el contexto de Gemini, no bloquea

    // Determinar contexto adicional basado en elegibilidad y datos completos
    let additionalContext = '';
    if (currentData.ciclo && currentData.elegible === false) {
      additionalContext = `
      ATENCIÓN: El estudiante indicó que egresó en ${currentData.ciclo}.
      Este ciclo NO ES ELEGIBLE para el programa (posterior a 2023-2).
      Informa amablemente que no puede acceder y redirige a paccis@uss.edu.pe para alternativas. Mantén corto. NO inscribas.
      `;
      console.log('🚫 Estudiante NO elegible:', currentData.ciclo);
    } else if (currentData.ciclo && currentData.elegible === true) {
      additionalContext = `
      El estudiante egresó en ${currentData.ciclo} - ES ELEGIBLE. Continúa con invitación y detalles (usa credenciales existentes; lista cursos si info general). Si faltan datos menores, pregunta suavemente.
      `;
      console.log('✅ Estudiante elegible:', currentData.ciclo);
    } else {
      additionalContext = `
      No se detectó ciclo completo. Si es info general, lista cursos defrente. Pregunta datos solo si inscribir o faltan clave (no repitas si ya preguntado). Mantén corto.
      `;
    }

    // NUEVA MEJORA: Si todos los datos están completos, personaliza la respuesta SOLO la primera vez
    const introSent = currentData.introSent || false; // NUEVO: Flag para evitar repeticiones
    if (faltan.length === 0) {
      if (!introSent) {
        // PRIMERA VEZ: Intro completa
        additionalContext += `
        Todos los datos del estudiante están completos: ${JSON.stringify(currentData, null, 2)}. Esta es la primera respuesta con datos completos: Saluda por nombre (ej: Hola ${currentData.nombre}! 😊), confirma elegibilidad, resume su situación (ej: Has completado Computación 1, puedes inscribirte en 2 y/o 3), y pregunta qué necesita específicamente (info general, pasos de inscripción, dudas sobre pago, etc.). Proporciona info completa y útil basada en el PDF, sin cortar oraciones.`;
        currentData.introSent = true; // NUEVO: Marcar como enviado
        studentData.set(sessionId, currentData);
      } else {
        // POSTERIORES: Conversación fluida, sin repetir intro
        additionalContext += `
        Datos completos ya confirmados en intro anterior. Responde directamente a la nueva pregunta de manera natural y fluida. NO repitas saludo, confirmación de elegibilidad, lista de cursos o resumen de situación a menos que sea relevante para la consulta actual. Usa el historial para referencia (ej: "Como mencioné antes sobre los pagos..."). Si faltan datos menores, pregúntalos al final suavemente. Mantén respuestas cortas y enfocadas.`;
      }
    } else if (faltan.length > 0 && faltan.length <= 2) {
      additionalContext += `
      Faltan datos menores: ${faltan.join(', ')}. Pregunta suavemente por ellos al final de la respuesta, pero responde la consulta principal primero.`;
    }

    // MEJORA PARA "APRENDIZAJE": Incluir historial resumido en el prompt para fluidez (aprende patrones de la sesión)
    let historySummary = '';
    const sessionHistory = conversationHistory.get(sessionId) || [];
    if (sessionHistory.length > 0) {
      // Resumir últimas 5 interacciones para contexto sin exceder tokens
      const recentHistory = sessionHistory.slice(-10); // Aumentado a 10 para más "memoria"
      historySummary = `\n\nHistorial reciente de la conversación (para fluidez y continuidad):\n${recentHistory.map(h => `${h.role}: ${h.content.substring(0, 100)}...`).join('\n')}`;
      // Opcional: Detectar patrones comunes (ej. si preguntan mucho por "inscripción", priorizar)
      const commonTopics = recentHistory.filter(h => h.content.toLowerCase().includes('inscrip')).length > 1 ? '\nNota: Usuario ha preguntado repetidamente por inscripción; enfócate en pasos del PDF.' : '';
      historySummary += commonTopics;
    }

    // Verificar API key
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: 'API key de Gemini no configurada',
        response: 'Error de configuración. Contacta al administrador.'
      });
    }

    // Intentar con diferentes modelos de Gemini (ACTUALIZADO: Modelos 2025, prioriza flash para velocidad)
    const modelsToTry = [
      'gemini-2.5-flash', // Más rápido y fluido para chat
      'gemini-2.5-pro',
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite'
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
                      text: `${SYSTEM_CONTEXT}${additionalContext}\n\nDatos actuales del estudiante: ${JSON.stringify(currentData)}${historySummary}\n\nMensaje del usuario: ${message}\n\nSi el mensaje parece contener datos del usuario (nombre, correo, etc.), ignóralo como pregunta principal y usa los datos extraídos para personalizar. Mantén una conversación natural y fluida: responde directamente a la consulta actual, sin repetir info del historial. Analiza el PDF para detalles específicos y proporciona respuestas completas pero concisas, sin cortar oraciones.`
                    }
                  ]
                }
              ],
              generationConfig: {
                temperature: 0.5, // Ajustado para más fluidez (menos rígido que 0.6)
                maxOutputTokens: 600,  // Aumentado para respuestas más completas
                topP: 0.8, // Agregado para diversidad controlada
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
            // MEJORA: Si la respuesta es muy corta (<50 chars), intenta con siguiente modelo
            if (botResponse.length < 50) {
              console.log('⚠️ Respuesta muy corta, probando siguiente modelo.');
              continue;
            }
            console.log(`✅ Respuesta obtenida del modelo: ${model} (longitud: ${botResponse.length})`);
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

    if (!botResponse || botResponse.length < 50) {
      // NUEVO: Fallback ajustado para no repetir si intro ya enviada
      if (introSent) {
        botResponse = `¡Hola de nuevo! 😊 ¿En qué puedo ayudarte con el Programa de Computación para Egresados? (Ej: detalles de pago, acceso al Aula USS, o dudas específicas). Basado en lo que ya sabemos de ti, dime qué necesitas exactamente.`;
      } else {
        // Fallback original solo si no se envió intro
        botResponse = `¡Hola ${currentData.nombre || ''}! 😊 Gracias por proporcionar tus datos. Basado en tu información (egresado ${currentData.ciclo || 'reciente'}, curso actual: ${currentData.ultimoCurso || 'ninguno'}), eres elegible para el Programa de Computación para Egresados (hasta 2023-2).

📚 **Cursos disponibles (S/200 cada uno):**
- Computación 1: Microsoft Word (Intermedio-Avanzado)
- Computación 2: Microsoft Excel (Básico-Intermedio-Avanzado)
- Computación 3: IBM SPSS y MS Project

**Pasos para inscribirte:**
1. Ingresa al Campus USS > Trámites > Programación de Servicios > Programa de Computación para Egresados USS > Programar (S/200).
2. Realiza el pago (ver métodos).
3. Envía comprobante a centrodeinformatica@uss.edu.pe.

💳 **Métodos de pago:** 1. Tarjeta QR (activa check condiciones). 2. Yape (servicios programables, código alumno). 3. BCP App (Pagar servicios > Programables, código). 4. Agente BCP (cta 305-1552328-0-87, 24h). App/agencia: 3-5h.

**Evaluación:** 4 cuestionarios (30 min cada uno), promedio (C1+C2+C3+C4)/4.

¿En qué curso quieres inscribirte o qué duda tienes? (Ej: pasos detallados, acceso Aula USS).

Para más consultas o trámites, contacta al 📞 986 724 506 o 📧 centrodeinformatica@uss.edu.pe.`;
      }
    }

    // Guardar conversación (aumentado límite para "aprendizaje")
    let updatedHistory = conversationHistory.get(sessionId) || [];
    updatedHistory.push({ role: 'user', content: message });
    updatedHistory.push({ role: 'assistant', content: botResponse });
    
    if (updatedHistory.length > 30) { // Aumentado de 20 a 30 para más contexto histórico
      updatedHistory = updatedHistory.slice(-30);
    }
    conversationHistory.set(sessionId, updatedHistory);

    // Actualizar interacciones
    currentData.interactions = (currentData.interactions || 0) + 1;
    studentData.set(sessionId, currentData);

    // Guardar datos en Firestore si están disponibles (al menos nombre y correo)
    if (currentData.nombre && currentData.correo) {
      await guardarDatosEstudiante(currentData);
    }

    console.log('✅ Respuesta enviada exitosamente (longitud:', botResponse.length, ')');

    return res.status(200).json({ 
      response: botResponse,
      sessionId: sessionId,
      studentData: currentData,
      isEligible: currentData.elegible !== false
    });

  } catch (error) {
    console.error('❌ Error en el servidor:', error);
    
    // NUEVO: Error también chequea introSent para fallback fluido
    const currentData = studentData.get(sessionId) || {};
    const introSent = currentData.introSent || false;
    let errorResponse = '';
    if (introSent) {
      errorResponse = '¡Ups! Problema técnico rápido. ¿Qué duda tienes ahora sobre el programa? (Ej: pagos o evaluación).';
    } else {
      errorResponse = '¡Hola! 😊 Hubo un problema técnico temporal. Mientras, aquí va info rápida del Programa: 100% virtual para egresados hasta 2023-2. Cursos S/200: Word, Excel, SPSS/Project. Inscríbete: Campus > Trámites > Programación > Programa Egresados > Programar > Paga > Envía a centrodeinformatica@uss.edu.pe. Evaluación: 4 cuestionarios (30 min c/u). ¿Qué necesitas? Para más, 📧 centrodeinformatica@uss.edu.pe 📞 986 724 506';
    }
    
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      response: errorResponse
    });
  }
});

// Función para guardar datos en Firestore
async function guardarDatosEstudiante(data) {
  if (!data || !data.nombre || !data.correo) return;
  try {
    await db.collection('estudiantes').add({
      nombre: data.nombre,
      ciclo: data.ciclo || '',
      correo: data.correo,
      telefono: data.telefono || '',
      año_egreso: data.año_egreso || '',
      ultimoCurso: data.ultimoCurso || '',
      fecha: new Date().toISOString()
    });
    console.log('✅ Datos guardados en Firebase:', data.correo);
  } catch (err) {
    console.error('❌ Error guardando en Firebase:', err);
  }
}

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
app.listen(PORT, async () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📡 Centro de Informática USS - Chatbot v3.5 (Mejora: Conversación fluida sin repeticiones post-intro)`);
  console.log(`✅ Validación de elegibilidad activada (hasta 2023-2) - General para todas las carreras`);
  
  // Cargar PDF al inicio
  await loadPdfContent();
  
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    console.log(`⚠️  ADVERTENCIA: GEMINI_API_KEY no configurada`);
  } else {
    console.log(`✅ Gemini AI configurado correctamente`);
  }
  
  if (pdfContent.startsWith('Error')) {
    console.log(`⚠️  ADVERTENCIA: PDF no cargado correctamente. Respuestas basadas en info base.`);
  } else {
    console.log(`✅ PDF "Guía Programa de Computación Egresados V2" integrado en contexto IA.`);
  }
});