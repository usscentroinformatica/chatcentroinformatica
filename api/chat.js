// /api/chat.js - Serverless function para Vercel (Node.js)
const fetch = require('node-fetch');
require('dotenv').config();
const admin = require('firebase-admin');  // Para FieldValue.serverTimestamp
const db = require('../firebase');  // Tu firebase.js (Admin SDK)

// Variables in-memory para sesiones (fallback si Firebase falla, pero usa FS principal)
const conversationHistory = new Map();

// SYSTEM_CONTEXT completo (del original)
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

// Contenido PDF hardcodeado (del original)
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

// Función extractStudentData mejorada (con cursos secuenciales)
function extractStudentData(message) {
  const data = {};
  const normalized = message.toLowerCase().replace(/[^\w\s@\-.:]/g, ' ').trim();

  // Nombre
  const nombreCandidates = normalized.split(/\s+/).filter(word => word.length > 2 && !word.match(/^\d|numero|telefonico|correo|año|egreso|curso|ninguno|llevado/i)).join(' ').match(/\b[a-záéíóúüñ]{3,}\s+[a-záéíóúüñ]{3,}\b/i);
  if (nombreCandidates && nombreCandidates[0].split(' ').length >= 2) {
    data.nombre = nombreCandidates[0].charAt(0).toUpperCase() + nombreCandidates[0].slice(1);
  }

  // Correo
  const correoMatch = message.match(/([a-zA-Z0-9._%+-]+@(?:uss\.edu\.pe|crece\.uss\.edu\.pe))/i);
  if (correoMatch) data.correo = correoMatch[1].toLowerCase();

  // Teléfono
  const telefonoMatch = message.match(/(?:\+51\s?)?9\d{8}/);
  if (telefonoMatch) data.telefono = telefonoMatch[0];

  // Ciclo (acepta 2023-1 o 202301)
  const cicloMatch = message.match(/(\d{4}-[12]|\d{6})/i);
  if (cicloMatch) {
    let ciclo = cicloMatch[1].toUpperCase();
    if (ciclo.length === 6) ciclo = ciclo.slice(0,4) + '-' + ciclo.slice(4);
    data.ciclo = ciclo;
    data.año_egreso = ciclo;
    const [year, semester] = data.ciclo.split('-');
    const yearNum = parseInt(year);
    const semesterNum = parseInt(semester || '1');
    data.elegible = !(yearNum > 2023 || (yearNum === 2023 && semesterNum > 2));
  }

  // Curso tomado
  const cursoTomadoMatch = message.match(/(?:llevado|llev[eo]|tomado)\s*(?:computaci[óo]n|comp)\s*([123]|ninguno)/i);
  if (cursoTomadoMatch) {
    data.cursoTomado = cursoTomadoMatch[1].toLowerCase();
  } else if (message.toLowerCase().includes('ninguno')) {
    data.cursoTomado = 'ninguno';
  }

  // Inferir pendiente secuencial
  if (data.cursoTomado) {
    switch (data.cursoTomado) {
      case '1': data.cursoPendiente = '2'; break;
      case '2': data.cursoPendiente = '3'; break;
      case '3': data.cursoPendiente = 'ninguno'; break;
      case 'ninguno': data.cursoPendiente = '1'; break;
      default: data.cursoPendiente = '1';
    }
    data.ultimoCurso = `Computación ${data.cursoTomado === 'ninguno' ? 'ninguno' : data.cursoTomado}`;
  }

  return data;
}

// Merge inteligente
function mergeData(oldData, newData) {
  const protectedKeys = ['nombre', 'correo', 'ciclo', 'año_egreso', 'ultimoCurso', 'cursoTomado', 'cursoPendiente'];
  Object.keys(newData).forEach(key => {
    if (protectedKeys.includes(key) && oldData[key]) {
      delete newData[key];
    }
  });
  return { ...oldData, ...newData };
}

// Datos faltantes (solo esenciales inicial)
function datosFaltantes(data) {
  const faltan = [];
  if (!data.nombre) faltan.push('nombre completo');
  if (!data.correo) faltan.push('correo institucional');
  if (!data.año_egreso) faltan.push('año de egreso (ej: 2022-1 o 202301)');
  if (!data.telefono) faltan.push('número telefónico');
  return faltan;
}

// Firebase functions
async function getStudentData(sessionId) {
  try {
    const doc = await db.collection('sessions').doc(sessionId).get();
    return doc.exists ? doc.data() : {};
  } catch (err) {
    console.error('Error get student:', err);
    return {};
  }
}

async function setStudentData(sessionId, data) {
  try {
    await db.collection('sessions').doc(sessionId).set(data, { merge: true });
    setTimeout(() => db.collection('sessions').doc(sessionId).delete(), 3600000);  // TTL 1h
  } catch (err) {
    console.error('Error set student:', err);
  }
}

async function getConversationHistory(sessionId) {
  const data = await getStudentData(sessionId);
  return data.history || [];
}

async function setConversationHistory(sessionId, history) {
  if (history.length > 30) history = history.slice(-30);
  try {
    await db.collection('sessions').doc(sessionId).update({ history });
  } catch (err) {
    console.error('Error set history:', err);
  }
}

async function saveEstudiante(data) {
  if (!data.nombre || !data.correo || !data.año_egreso) {
    console.log('❌ No guardar: Faltan datos base', JSON.stringify(data));
    return;
  }
  try {
    console.log('🔄 Intentando guardar:', JSON.stringify(data, null, 2));
    await db.collection('estudiantes').add({
      nombre: data.nombre,
      correo: data.correo,
      telefono: data.telefono || '',
      año_egreso: data.año_egreso,
      ultimoCurso: data.ultimoCurso || 'ninguno',
      cursoTomado: data.cursoTomado || 'ninguno',
      cursoPendiente: data.cursoPendiente || '1',
      elegible: data.elegible !== false,
      fecha_registro: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pendiente'
    });
    console.log('✅ Egresado guardado:', data.correo);
  } catch (err) {
    console.error('❌ Error save estudiante:', err.message);
    await db.collection('errors').add({ error: err.message, data, timestamp: new Date() });
  }
}

// Main function
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Falta GEMINI_API_KEY' });
    }

    const { message, sessionId = 'default' } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }

    // Extraer y merge
    const extractedData = extractStudentData(message);
    let currentData = await getStudentData(sessionId);
    currentData = mergeData(currentData, extractedData);
    currentData.lastActivity = Date.now();
    await setStudentData(sessionId, currentData);

    const faltan = datosFaltantes(currentData);
    console.log('📊 Datos detectados:', JSON.stringify(currentData, null, 2));
    console.log('📊 Faltan:', faltan.length, 'campos:', faltan);

    // Guardado parcial si base completa
    if (currentData.nombre && currentData.correo && currentData.año_egreso) {
      console.log('💾 Guardando datos base...');
      await saveEstudiante(currentData);
    }

    // Pide datos si >2 faltan (solo esenciales)
    if (faltan.length > 2) {
      currentData.hasAskedForData = true;
      currentData.interactions = (currentData.interactions || 0) + 1;
      await setStudentData(sessionId, currentData);

      return res.status(200).json({
        response: `¡Hola! 😊 Para ayudarte mejor con el Programa de Computación para Egresados, necesito algunos datos. Envía solo lo que falta, cada uno en una línea:\n\n- ${faltan.join('\n- ')}\n\nEjemplo:\n- Nombre: Juan Pérez\n- Correo: juan@uss.edu.pe\n\nUna vez que los tengas, continuamos. 📚`,
        sessionId,
        studentData: currentData,
        isEligible: false
      });
    }

    // Additional context con cursos
    let additionalContext = '';
    if (currentData.ciclo && currentData.elegible === false) {
      additionalContext = `ATENCIÓN: Ciclo ${currentData.ciclo} NO ELEGIBLE (post 2023-2). Informa amablemente y redirige a paccis@uss.edu.pe. Mantén corto.`;
    } else if (currentData.ciclo && currentData.elegible === true) {
      additionalContext = `Egresado en ${currentData.ciclo} - ELEGIBLE. Si cursoTomado (ej: '2'), responde: "Te falta Computación ${cursoPendiente}: [descripción] S/200". No digas "ya llevaste X", solo enfócate en pendiente. Lista solo cursos pendientes. Si 'ninguno', ofrece desde 1. Usa credenciales existentes.`;
    } else {
      additionalContext = `No ciclo detectado. Lista cursos defrente si general. Pregunta datos solo si inscribir.`;
    }

    if (faltan.length === 0 && !currentData.introSent) {
      additionalContext += `Datos completos. Primera respuesta: Saluda por nombre, confirma elegibilidad, resume pendiente (ej: "Te falta Computación ${cursoPendiente}"), pregunta qué necesita (inscripción, pago).`;
      currentData.introSent = true;
      await setStudentData(sessionId, currentData);
    } else if (faltan.length > 0 && faltan.length <= 2) {
      additionalContext += `Faltan menores: ${faltan.join(', ')}. Pregunta al final suavemente.`;
    }

    // History summary
    let historySummary = '';
    const sessionHistory = await getConversationHistory(sessionId);
    if (sessionHistory.length > 0) {
      const recent = sessionHistory.slice(-10);
      historySummary = `\n\nHistorial reciente:\n${recent.map(h => `${h.role}: ${h.content.substring(0, 100)}...`).join('\n')}`;
    }

    // Modelos Gemini
    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-2.5-pro',
      'gemini-2.0-flash'
    ];

    let botResponse = '';
    for (const model of modelsToTry) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `${SYSTEM_CONTEXT}${additionalContext}\n\nDatos estudiante: ${JSON.stringify(currentData)}${historySummary}\n\nMensaje usuario: ${message}\n\nMantén natural, fluido, sin repetir historial. Analiza PDF para detalles. Si cursoPendiente, enfócate en eso para inscripción. Responde completo pero conciso.`
                }]
              }],
              generationConfig: {
                temperature: 0.5,
                maxOutputTokens: 600,
                topP: 0.8,
                topK: 40
              },
              safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
              ]
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts[0].text) {
            botResponse = data.candidates[0].content.parts[0].text.trim();
            if (botResponse.length >= 50) break;
          }
        }
      } catch (error) {
        console.log(`Error modelo ${model}:`, error.message);
      }
    }

    // Fallback si Gemini falla
    if (!botResponse || botResponse.length < 50) {
      const introSent = currentData.introSent || false;
      if (introSent) {
        botResponse = `¡Hola de nuevo! 😊 ¿Qué duda tienes sobre el programa? (Ej: inscripción en Computación ${currentData.cursoPendiente || 1}, pagos).`;
      } else {
        botResponse = `¡Hola ${currentData.nombre || ''}! 😊 Eres elegible (ciclo ${currentData.ciclo}). Te falta Computación ${currentData.cursoPendiente || 1}: [descripción breve] S/200.\n\nPasos: 1. Campus > Trámites > ... [resumen]. ¿Inscribirte o duda específica?\n\nPara más, 📞 986 724 506.`;
      }
    }

    // History update
    let updatedHistory = await getConversationHistory(sessionId);
    updatedHistory.push({ role: 'user', content: message });
    updatedHistory.push({ role: 'assistant', content: botResponse });
    await setConversationHistory(sessionId, updatedHistory);

    currentData.interactions = (currentData.interactions || 0) + 1;
    await setStudentData(sessionId, currentData);

    return res.status(200).json({
      response: botResponse,
      sessionId,
      studentData: currentData,
      isEligible: currentData.elegible !== false
    });

  } catch (error) {
    console.error('Error servidor:', error);
    return res.status(500).json({ error: 'Error interno', response: '¡Ups! Problema técnico. Contacta 📞 986 724 506.' });
  }
};
