// Servidor Express para el Chatbot USS.
// Expone endpoints HTTP para salud y chat y delega generación a la API de Gemini.
// Requiere variables de entorno: GEMINI_API_KEY y opcionalmente PORT.
// Mantener las respuestas y mensajes en español para coherencia con el público objetivo.
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

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

📝 **Por favor, compárteme:**
1️⃣ Tu nombre completo
2️⃣ Tu ciclo de egreso (ejemplo: 2023-1, 2022-2, 2018-1, etc.)
3️⃣ Último curso de computación que llevaste (Computación 1, 2 o 3)

Espero tu respuesta para continuar 😊"

VALIDACIÓN DE ELEGIBILIDAD:
Una vez recibas los datos, valida:
- Si egresó en 2023-2 o ANTES (2023-1, 2022-2, 2021-1, 2020-2, 2018-2, etc.) → ES ELEGIBLE, ayúdalo normalmente
- Si egresó en 2024-1 o DESPUÉS (2024-1, 2024-2, 2025-1, etc.) → NO ES ELEGIBLE, responde:

"Gracias por tu información, [Nombre]. Lamentablemente, el Programa de Computación para Egresados está dirigido únicamente a egresados hasta el ciclo 2023-2.

Como egresaste en [ciclo], te recomiendo contactar a:
📧 **paccis@uss.edu.pe**

Ellos podrán orientarte sobre otras opciones disponibles para tu situación. ¡Mucho éxito! 😊"

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

INSTRUCCIONES CRÍTICAS:
- SIEMPRE pide los 3 datos (nombre, ciclo, último curso) al inicio antes de dar cualquier información
- Valida el ciclo: 2023-2 o antes = elegible, 2024-1 o después = deriva a paccis@uss.edu.pe
- Sé amigable y natural en todo momento
- Usa emojis apropiadamente
- Si dan correo @uss.edu.pe, confirma que le enviaremos los pasos por correo
- Respuestas concisas pero completas
- Mantén un registro mental de los datos del usuario durante toda la conversación`;

// Ruta principal
app.get('/', (req, res) => {
  res.json({ message: 'API del Chatbot USS funcionando correctamente' });
});

// Endpoint del chat: intenta múltiples modelos de Gemini y devuelve el primer texto válido
app.post('/api/chat', async (req, res) => {
  try {
    // Espera un JSON { message: string } en el cuerpo de la solicitud
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Mensaje requerido' });
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
                  text: `${contextoPrograma}\n\nUsuario: ${message}\n\nAsistente:`
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

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📡 Listo para recibir consultas del chatbot`);
});