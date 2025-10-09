// Serverless function para Vercel que implementa el endpoint /api/chat
// Usa la misma lógica del backend pero sin Express, ideal para producción en Vercel.

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Clave API hardcodeada temporalmente para evitar problemas con Environment Variables
    const GEMINI_API_KEY = 'AIzaSyDB0hTWu-d3i5EIlzA34KwjEN4nQiq_SjE';
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Falta la variable de entorno GEMINI_API_KEY' });
    }

    const { message } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }

    // Contexto del programa (prompt del sistema)
    const contextoPrograma = `Eres un asistente amigable y profesional del Centro de Informática de la Universidad Señor de Sipán (USS).

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

INSTRUCCIONES:
- Sé amigable y natural
- Usa emojis apropiadamente
- Si dan correo @uss.edu.pe, confirma y explica siguientes pasos
- Verifica año de egreso para elegibilidad
- Respuestas concisas pero completas`;

    // Fallback progresivo entre modelos
    const modelsToTry = [
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent',
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent'
    ];

    let lastError = null;

    for (const modelUrl of modelsToTry) {
      try {
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

        if (response.ok && data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
          const text = data.candidates[0].content.parts[0].text;
          return res.status(200).json({ response: text });
        }

        lastError = data.error?.message || 'Error desconocido';
      } catch (error) {
        lastError = error.message;
      }
    }

    throw new Error(`No se pudo conectar con ningún modelo de Gemini. Último error: ${lastError}`);
  } catch (error) {
    console.error('Error en /api/chat:', error);
    return res.status(500).json({
      error: 'Error al procesar la consulta',
      details: error.message,
    });
  }
};
