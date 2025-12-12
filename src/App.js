import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Moon, Sun, Mic, FileText, X, Menu, XCircle } from 'lucide-react';

function App() {
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [showSplash, setShowSplash] = useState(true);
  const [showPdfGuide, setShowPdfGuide] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [messages, setMessages] = useState([
    { 
      type: 'bot', 
      text: '¡Hola! 👋 Bienvenido al Centro de Informática USS.\n\n¿Eres egresado de pregrado de la USS?',
      buttons: [
        { text: 'Sí, soy egresado', value: 'es_egresado' },
        { text: 'No soy egresado', value: 'no_egresado' },
        { text: '❓ Tengo otra consulta', value: 'otra_consulta' }
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [currentStep, setCurrentStep] = useState('elegibilidad');
  const [userData, setUserData] = useState({});
  const messagesEndRef = useRef(null);

  // Definición de colores
  const COLORS = {
    morado: '#5a2290',
    celeste: '#11acd3',
    verde: '#63ed12',
    moradoIcono: '#5a2290',
    verdeHover: '#4ac010',
    celesteHover: '#0e9abf',
    blanco: '#ffffff',
    grisClaro: '#f0f0f0',
    grisOscuro: '#333333'
  };

  const API_URL = process.env.NODE_ENV === 'production' ? '/api/chat' : 'http://localhost:5000/api/chat';

  // Función para detectar consultas específicas y responder directamente
  const detectAndRespondToKeywords = (message) => {
    const lowerMsg = message.toLowerCase().trim();
    
    // Detectar palabras clave relacionadas con constancias/certificados
    if (lowerMsg.includes('constancia') || lowerMsg.includes('certificado') || 
        lowerMsg.includes('certificacion') || lowerMsg.includes('documento') ||
        lowerMsg.includes('papel') || lowerMsg.includes('comprobante')) {
      return {
        type: 'bot',
        text: `📋 **INFORMACIÓN SOBRE CONSTANCIAS Y CERTIFICADOS**

Para solicitar constancias, certificados o documentos oficiales del programa, contacta directamente a:

📧 **Correo oficial:** acempresariales@uss.edu.pe
📞 **Teléfono:** 986 724 506
📍 **Oficina:** Centro de Informática USS

**Horario de atención:**
🕐 Lunes a viernes: 8:00 AM - 6:00 PM
🕐 Sábados: 9:00 AM - 12:00 PM

**Requisitos para solicitud:**
• Nombre completo
• Código de alumno
• Correo institucional (@uss.edu.pe)
• Especificar tipo de documento requerido

¿Necesitas ayuda con algo más?`,
        buttons: [
          { text: '📚 Información de cursos', value: 'ver_cursos' },
          { text: '📝 Proceso de inscripción', value: 'ver_proceso' },
          { text: '❓ Otra consulta', value: 'otra_consulta' }
        ]
      };
    }
    
    // Detectar contacto/soporte técnico
    if (lowerMsg.includes('contacto') || lowerMsg.includes('soporte') || 
        lowerMsg.includes('telefono') || lowerMsg.includes('correo') ||
        lowerMsg.includes('llamar') || lowerMsg.includes('escribir')) {
      return {
        type: 'bot',
        text: `📞 **CONTACTOS CENTRO DE INFORMÁTICA USS**

📧 **General:** centrodeinformatica@uss.edu.pe
📱 **Teléfono:** 986 724 506

🔧 **Soporte técnico:**
• ciso.dti@uss.edu.pe
• helpdesk1@uss.edu.pe

📋 **Constancias y documentos:** acempresariales@uss.edu.pe
📚 **Trámites académicos:** paccis@uss.edu.pe

**Horario de atención:**
🕐 Lunes a viernes: 8:00 AM - 6:00 PM
🕐 Sábados: 9:00 AM - 12:00 PM

¿En qué más puedo ayudarte?`,
        buttons: [
          { text: '📚 Cursos disponibles', value: 'ver_cursos' },
          { text: '💳 Métodos de pago', value: 'metodos_pago' },
          { text: '❓ Otra consulta', value: 'otra_consulta' }
        ]
      };
    }
    
    // Detectar pagos/métodos de pago
    if (lowerMsg.includes('pago') || lowerMsg.includes('pagar') || 
        lowerMsg.includes('yape') || lowerMsg.includes('bcp') ||
        lowerMsg.includes('tarjeta') || lowerMsg.includes('dinero')) {
      return {
        type: 'bot',
        text: `💳 **MÉTODOS DE PAGO**

1. **Campus Virtual - Gestión Financiera**
   • Tarjeta Visa/Mastercard
   • Billetera digital / QR

2. **Yape**
   • Servicios programables
   • Ingresa tu código de alumno

3. **Aplicativo BCP**
   • Pagar servicios
   • "Servicios Programables"
   • Se refleja en 3-5 horas

4. **Agente/Agencia BCP**
   • Cuenta: 305-1552328-0-87
   • Se refleja en hasta 24 horas

💰 **Todos los cursos cuestan S/ 200 cada uno**

¿Necesitas ayuda con el proceso de inscripción?`,
        buttons: [
          { text: '📝 Proceso de inscripción', value: 'ver_proceso' },
          { text: '📚 Ver cursos', value: 'ver_cursos' },
          { text: '❓ Otra consulta', value: 'otra_consulta' }
        ]
      };
    }
    
    // Detectar cursos/computación
    if (lowerMsg.includes('curso') || lowerMsg.includes('computacion') || 
        lowerMsg.includes('word') || lowerMsg.includes('excel') ||
        lowerMsg.includes('spss') || lowerMsg.includes('project')) {
      return {
        type: 'bot',
        text: `📚 **CURSOS DISPONIBLES** (S/ 200 cada uno)

📝 **Computación 1:** Microsoft Word (Intermedio-Avanzado)
📊 **Computación 2:** Microsoft Excel (Básico-Avanzado)
📈 **Computación 3:** IBM SPSS y MS Project

**Características:**
• 100% virtual (Aula USS)
• Acceso 24/7
• Autoaprendizaje
• 4 evaluaciones por curso

¿Te interesa algún curso en particular?`,
        buttons: [
          { text: '📝 Computación 1 - Word', value: 'curso_1' },
          { text: '📊 Computación 2 - Excel', value: 'curso_2' },
          { text: '📈 Computación 3 - SPSS/Project', value: 'curso_3' },
          { text: '❓ Otra consulta', value: 'otra_consulta' }
        ]
      };
    }
    
    // Detectar proceso/inscripción
    if (lowerMsg.includes('proceso') || lowerMsg.includes('inscri') || 
        lowerMsg.includes('registr') || lowerMsg.includes('matricul') ||
        lowerMsg.includes('como me inscribo') || lowerMsg.includes('pasos')) {
      return {
        type: 'bot',
        text: `📋 **PROCESO DE INSCRIPCIÓN**

1️⃣ Ingresa al Campus USS con tus credenciales
2️⃣ Ve a "Trámites" > "PROGRAMACIÓN DE SERVICIOS"
3️⃣ Selecciona "PROGRAMA DE COMPUTACIÓN PARA EGRESADOS USS"
4️⃣ Haz clic en "Programar"
5️⃣ Realiza el pago de S/ 200
6️⃣ Envía el comprobante a: centrodeinformatica@uss.edu.pe

**Tiempo de procesamiento:** 24-48 horas hábiles

¿Necesitas información sobre métodos de pago?`,
        buttons: [
          { text: '💳 Métodos de pago', value: 'metodos_pago' },
          { text: '📚 Ver cursos', value: 'ver_cursos' },
          { text: '❓ Otra consulta', value: 'otra_consulta' }
        ]
      };
    }
    
    // Detectar elegibilidad/requisitos
    if (lowerMsg.includes('elegible') || lowerMsg.includes('requisito') || 
        lowerMsg.includes('puedo llevar') || lowerMsg.includes('puedo tomar') ||
        lowerMsg.includes('soy de ciclo') || lowerMsg.includes('2023') || lowerMsg.includes('2024')) {
      return {
        type: 'bot',
        text: `🎓 **REQUISITOS DE ELEGIBILIDAD**

El programa está dirigido a:
• Egresados de pregrado USS
• Hasta el ciclo **2023-2**
• Con pendiente de acreditación en cursos de computación

**Si eres de ciclo 2024-1 o posterior:**
Contacta a paccis@uss.edu.pe para orientación

**¿Eres egresado hasta 2023-2?`,
        buttons: [
          { text: '✅ Sí, soy elegible', value: 'elegible_si' },
          { text: '❌ No soy elegible', value: 'elegible_no' },
          { text: '❓ Otra consulta', value: 'otra_consulta' }
        ]
      };
    }
    
    // Si no detecta ninguna palabra clave específica, devolver null para usar la IA
    return null;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme === 'true') {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'es-ES';
      
      recognitionInstance.onstart = () => setIsListening(true);
      
      recognitionInstance.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }
        if (finalTranscript) {
          setInput(prev => prev + finalTranscript);
        }
      };
      
      recognitionInstance.onend = () => setIsListening(false);
      recognitionInstance.onerror = (event) => {
        console.error('Error de reconocimiento de voz:', event.error);
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
  };

  const formatMessage = (text) => {
    let formatted = text.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>');
    formatted = formatted.replace(/^\* (.+)$/gm, '<span class="flex items-start gap-2 my-1"><span class="font-bold" style="color: #63ed12">•</span><span>$1</span></span>');
    formatted = formatted.replace(/^(\d+)\. (.+)$/gm, '<span class="flex items-start gap-2 my-1"><span class="font-bold" style="color: #63ed12">$1.</span><span>$2</span></span>');
    formatted = formatted.replace(/\n\n/g, '<br/><br/>');
    formatted = formatted.replace(/\n/g, '<br/>');
    return formatted;
  };

  const handleButtonClick = async (buttonValue, buttonText) => {
    const userMessage = { type: 'user', text: buttonText };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    let botResponse = '';
    let nextButtons = [];

    try {
      switch (buttonValue) {
        case 'es_egresado':
          setUserData(prev => ({ ...prev, esEgresado: true }));
          setCurrentStep('verificar_ciclo');
          botResponse = '¡Perfecto! Para verificar tu elegibilidad, necesito saber:\n\n¿Hasta qué ciclo estudiaste?';
          nextButtons = [
            { text: '2023-2 o anterior', value: 'ciclo_elegible' },
            { text: '2024-1 o posterior', value: 'ciclo_no_elegible' },
            { text: '❓ Otra consulta', value: 'otra_consulta' }
          ];
          break;

        case 'no_egresado':
          botResponse = 'Entiendo. El Programa de Computación para Egresados está diseñado exclusivamente para egresados de pregrado.\n\n¿Hay algo más en lo que pueda ayudarte?';
          nextButtons = [
            { text: '❓ Tengo otra consulta', value: 'otra_consulta' },
            { text: '📧 Ver contactos', value: 'ver_contactos' }
          ];
          break;

        case 'ciclo_elegible':
          setUserData(prev => ({ ...prev, elegible: true }));
          setCurrentStep('menu_principal');
          botResponse = '¡Excelente! Eres elegible para el programa. 🎉\n\n¿Qué te gustaría hacer?';
          nextButtons = [
            { text: '📚 Ver cursos disponibles', value: 'ver_cursos' },
            { text: '📝 Proceso de inscripción', value: 'ver_proceso' },
            { text: '💳 Métodos de pago', value: 'metodos_pago' },
            { text: '❓ Otra consulta', value: 'otra_consulta' }
          ];
          break;

        case 'ciclo_no_elegible':
          setUserData(prev => ({ ...prev, elegible: false }));
          botResponse = 'Entiendo. El Programa de Computación para Egresados está disponible solo para estudiantes hasta el ciclo 2023-2.\n\nPara tu caso, te recomiendo contactar a:\n📧 paccis@uss.edu.pe\n📞 986 724 506';
          nextButtons = [
            { text: '❓ Otra consulta', value: 'otra_consulta' },
            { text: '📧 Ver más contactos', value: 'ver_contactos' }
          ];
          break;

        case 'ver_cursos':
          setCurrentStep('seleccion_curso');
          botResponse = `📚 **CURSOS DISPONIBLES** (S/ 200 cada uno)\n\nTodos son 100% virtuales, con acceso 24/7 en Aula USS:`;
          nextButtons = [
            { text: '📝 Computación 1 - Word (Intermedio-Avanzado)', value: 'curso_1' },
            { text: '📊 Computación 2 - Excel (Básico-Avanzado)', value: 'curso_2' },
            { text: '📈 Computación 3 - SPSS y MS Project', value: 'curso_3' },
            { text: 'ℹ️ Más detalles de todos', value: 'info_cursos' },
            { text: '❓ Otra consulta', value: 'otra_consulta' }
          ];
          break;

        case 'elegible_si':
          setUserData(prev => ({ ...prev, elegible: true }));
          setCurrentStep('datos_personales');
          botResponse = '¡Perfecto! Eres elegible para el programa.\n\nAhora necesito algunos datos para continuar. ¿Cuál es tu nombre completo?';
          nextButtons = [
            { text: 'Prefiero escribirlo', value: 'escribir_nombre' }
          ];
          break;

        case 'elegible_no':
          setUserData(prev => ({ ...prev, elegible: false }));
          botResponse = 'Entiendo. El Programa de Computación para Egresados está disponible solo para estudiantes hasta el ciclo 2023-2.\n\nPara tu caso, te recomiendo contactar a:\n📧 paccis@uss.edu.pe\n📞 986 724 506';
          nextButtons = [
            { text: 'Tengo otra consulta', value: 'otra_consulta' }
          ];
          break;

        case 'otra_consulta':
          setCurrentStep('consulta_libre');
          botResponse = 'Por supuesto, estoy aquí para ayudarte. 😊\n\nEscribe tu pregunta en el cuadro de texto y te responderé enseguida:';
          nextButtons = [];
          break;

        case 'ver_contactos':
          botResponse = `📞 **CONTACTOS CENTRO DE INFORMÁTICA USS**

📧 General: centrodeinformatica@uss.edu.pe
📱 Teléfono: 986 724 506

🔧 Soporte técnico:
• ciso.dti@uss.edu.pe
• helpdesk1@uss.edu.pe

📋 Constancias: acempresariales@uss.edu.pe
📚 Trámites académicos: paccis@uss.edu.pe

¿Hay algo más en lo que pueda ayudarte?`;
          nextButtons = [
            { text: '❓ Otra consulta', value: 'otra_consulta' },
            { text: '🔙 Volver al inicio', value: 'volver_inicio' }
          ];
          break;

        case 'volver_inicio':
          setCurrentStep('inicial');
          setUserData({});
          botResponse = '¡Perfecto! ¿En qué puedo ayudarte?';
          nextButtons = [
            { text: 'Soy egresado', value: 'es_egresado' },
            { text: 'No soy egresado', value: 'no_egresado' },
            { text: '❓ Tengo otra consulta', value: 'otra_consulta' }
          ];
          break;

        case 'escribir_nombre':
          botResponse = 'Por favor, escribe tu nombre completo en el cuadro de texto:';
          setCurrentStep('esperando_nombre');
          break;

        case 'confirmar_datos':
          setCurrentStep('seleccion_curso');
          botResponse = `Excelente, ${userData.nombre}. Ahora, ¿en qué curso estás interesado?\n\n📚 Cursos disponibles (S/ 200 cada uno):`;
          nextButtons = [
            { text: '📝 Computación 1 - Word (Intermedio-Avanzado)', value: 'curso_1' },
            { text: '📊 Computación 2 - Excel (Básico-Avanzado)', value: 'curso_2' },
            { text: '📈 Computación 3 - SPSS y MS Project', value: 'curso_3' },
            { text: 'Ver detalles de todos los cursos', value: 'info_cursos' }
          ];
          break;

        case 'curso_1':
        case 'curso_2':
        case 'curso_3':
          const cursoNumero = buttonValue.split('_')[1];
          const cursos = {
            '1': { nombre: 'Computación 1', contenido: 'Microsoft Word (Intermedio - Avanzado)' },
            '2': { nombre: 'Computación 2', contenido: 'Microsoft Excel (Básico - Intermedio - Avanzado)' },
            '3': { nombre: 'Computación 3', contenido: 'IBM SPSS y MS Project' }
          };
          
          setUserData(prev => ({ ...prev, cursoSeleccionado: cursos[cursoNumero].nombre }));
          setCurrentStep('confirmacion_curso');
          
          botResponse = `Has seleccionado: **${cursos[cursoNumero].nombre}**\n${cursos[cursoNumero].contenido}\n\n💰 Costo: S/ 200\n📚 100% Virtual\n⏰ Acceso 24/7\n📝 4 evaluaciones de 30 min c/u\n\n¿Qué deseas hacer?`;
          nextButtons = [
            { text: '📝 Ver proceso de inscripción', value: 'ver_proceso' },
            { text: '💳 Ver métodos de pago', value: 'metodos_pago' },
            { text: '🔄 Elegir otro curso', value: 'ver_cursos' },
            { text: 'ℹ️ Más información del curso', value: 'info_curso_detalle' },
            { text: '❓ Otra consulta', value: 'otra_consulta' }
          ];
          break;

        case 'info_cursos':
          botResponse = `📚 **CURSOS DISPONIBLES**\n\n**Computación 1** (S/ 200)\n• Microsoft Word Intermedio-Avanzado\n• Formato avanzado, estilos, plantillas\n• Tablas de contenido\n• Control de cambios\n\n**Computación 2** (S/ 200)\n• Microsoft Excel Básico-Avanzado\n• Fórmulas y funciones\n• Tablas dinámicas\n• Macros básicas\n\n**Computación 3** (S/ 200)\n• IBM SPSS (análisis estadístico)\n• MS Project (gestión de proyectos)\n\n¿En cuál estás interesado?`;
          nextButtons = [
            { text: 'Computación 1', value: 'curso_1' },
            { text: 'Computación 2', value: 'curso_2' },
            { text: 'Computación 3', value: 'curso_3' },
            { text: '❓ Otra consulta', value: 'otra_consulta' }
          ];
          break;

        case 'info_curso_detalle':
          const cursoActual = userData.cursoSeleccionado || 'el curso seleccionado';
          botResponse = `ℹ️ **MÁS INFORMACIÓN**\n\n**${cursoActual}**\n\n📖 **Metodología:**\n• 100% autoaprendizaje virtual\n• Material en PDF disponible 24/7\n• Videos y recursos interactivos\n• Sin horarios fijos\n\n📊 **Evaluación:**\n• 4 cuestionarios (30 min c/u)\n• Promedio = (C1 + C2 + C3 + C4) / 4\n• Nota mínima aprobatoria: 11\n\n⏱️ **Duración:**\n• A tu propio ritmo\n• Acceso hasta fin de ciclo\n\n¿Qué más te gustaría saber?`;
          nextButtons = [
            { text: '📝 Ver proceso de inscripción', value: 'ver_proceso' },
            { text: '💳 Métodos de pago', value: 'metodos_pago' },
            { text: '🔄 Ver otros cursos', value: 'ver_cursos' },
            { text: '❓ Otra consulta', value: 'otra_consulta' }
          ];
          break;

        case 'ver_proceso':
          setCurrentStep('proceso_inscripcion');
          botResponse = `📋 **PROCESO DE INSCRIPCIÓN**\n\n1️⃣ Ingresa al Campus USS con tus credenciales\n2️⃣ Ve a "Trámites"\n3️⃣ Selecciona "PROGRAMACIÓN DE SERVICIOS"\n4️⃣ Elige "PROGRAMA DE COMPUTACIÓN PARA EGRESADOS USS"\n5️⃣ Haz clic en "Programar"\n6️⃣ Realiza el pago de S/ 200\n7️⃣ Envía el comprobante a:\n📧 centrodeinformatica@uss.edu.pe\n\n¿Qué más necesitas saber?`;
          nextButtons = [
            { text: '💳 Ver métodos de pago', value: 'metodos_pago' },
            { text: '📚 Ver cursos', value: 'ver_cursos' },
            { text: '❓ Otra consulta', value: 'otra_consulta' }
          ];
          break;

        case 'metodos_pago':
          botResponse = `💳 **MÉTODOS DE PAGO**\n\n1. **Campus Virtual - Gestión Financiera**\n   • Tarjeta Visa/Mastercard\n   • Billetera digital / QR\n\n2. **Yape**\n   • Servicios programables\n   • Ingresa tu código de alumno\n\n3. **Aplicativo BCP**\n   • Pagar servicios\n   • "Servicios Programables"\n   • Se refleja en 3-5 horas\n\n4. **Agente/Agencia BCP**\n   • Cuenta: 305-1552328-0-87\n   • Se refleja en hasta 24 horas\n\n¿Hay algo más que quieras saber?`;
          nextButtons = [
            { text: '📝 Ver proceso completo', value: 'ver_proceso' },
            { text: '📚 Ver cursos', value: 'ver_cursos' },
            { text: '❓ Otra consulta', value: 'otra_consulta' }
          ];
          break;

        default:
          await handleSend(buttonText);
          return;
      }

      const botMessage = { type: 'bot', text: botResponse, buttons: nextButtons };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error procesando botón:', error);
      const errorMessage = { 
        type: 'bot', 
        text: 'Lo siento, hubo un error. Por favor intenta nuevamente.',
        buttons: [
          { text: '❓ Otra consulta', value: 'otra_consulta' }
        ]
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (messageText) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    const userMessage = { type: 'user', text: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // PRIMERO: Verificar si es una consulta con palabras clave específicas
      const keywordResponse = detectAndRespondToKeywords(textToSend);
      
      if (keywordResponse) {
        // Si detectamos palabras clave, responder directamente
        setMessages(prev => [...prev, keywordResponse]);
        setIsLoading(false);
        return;
      }

      // SEGUNDO: Lógica especial según el paso actual
      if (currentStep === 'esperando_nombre') {
        setUserData(prev => ({ ...prev, nombre: textToSend }));
        setCurrentStep('esperando_correo');
        
        const botMessage = { 
          type: 'bot', 
          text: `Mucho gusto, ${textToSend}. ¿Cuál es tu correo institucional (@uss.edu.pe)?`,
          buttons: []
        };
        setMessages(prev => [...prev, botMessage]);
        setIsLoading(false);
        return;
      }

      if (currentStep === 'esperando_correo') {
        const emailRegex = /@uss\.edu\.pe$/i;
        if (!emailRegex.test(textToSend)) {
          const botMessage = { 
            type: 'bot', 
            text: 'Por favor ingresa un correo institucional válido que termine en @uss.edu.pe',
            buttons: []
          };
          setMessages(prev => [...prev, botMessage]);
          setIsLoading(false);
          return;
        }

        setUserData(prev => ({ ...prev, correo: textToSend }));
        setCurrentStep('esperando_telefono');
        
        const botMessage = { 
          type: 'bot', 
          text: '¿Cuál es tu número de teléfono?',
          buttons: [
            { text: 'Prefiero no proporcionar', value: 'skip_telefono' }
          ]
        };
        setMessages(prev => [...prev, botMessage]);
        setIsLoading(false);
        return;
      }

      if (currentStep === 'esperando_telefono') {
        setUserData(prev => ({ ...prev, telefono: textToSend }));
        setCurrentStep('confirmar_datos_usuario');
        
        const botMessage = { 
          type: 'bot', 
          text: `Perfecto. Confirma tus datos:\n\n👤 Nombre: ${userData.nombre}\n📧 Correo: ${userData.correo}\n📱 Teléfono: ${textToSend}\n\n¿Los datos son correctos?`,
          buttons: [
            { text: '✅ Sí, continuar', value: 'confirmar_datos' },
            { text: '✏️ Corregir datos', value: 'corregir_datos' }
          ]
        };
        setMessages(prev => [...prev, botMessage]);
        setIsLoading(false);
        return;
      }

      // TERCERO: Si no es ninguna de las anteriores, usar la IA
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: textToSend,
          sessionId: sessionId,
          userData: userData
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }

      const data = await response.json();

      if (data.response) {
        const botMessage = { 
          type: 'bot', 
          text: data.response,
          buttons: [
            { text: '❓ Otra consulta', value: 'otra_consulta' }
          ]
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error(data.error || 'Error en la respuesta');
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = { 
        type: 'bot', 
        text: 'Lo siento, hubo un problema. Contacta a:\n📧 centrodeinformatica@uss.edu.pe\n📱 986 724 506',
        buttons: [
          { text: '❓ Otra consulta', value: 'otra_consulta' }
        ]
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startChat = () => {
    setShowSplash(false);
  };

  const toggleVoiceRecognition = () => {
    if (!recognition) {
      alert('Tu navegador no soporta reconocimiento de voz.');
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const togglePdfGuide = () => {
    setShowPdfGuide(!showPdfGuide);
  };

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  if (showSplash) {
    return (
      <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: COLORS.morado }}>
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-8">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="relative mb-8 sm:mb-12">
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto">
                <div 
                  className="w-full h-full rounded-full flex items-center justify-center"
                  style={{ 
                    backgroundColor: COLORS.verde,
                    border: `4px solid ${COLORS.morado}`,
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                  }}
                >
                  <Bot 
                    className="w-12 h-12 sm:w-16 sm:h-16 animate-bounce" 
                    style={{ color: COLORS.morado }}
                  />
                </div>
              </div>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-3 drop-shadow-2xl" style={{ color: COLORS.blanco }}>
              Asistente USS
            </h1>
            
            <p className="text-lg sm:text-xl font-light mb-8 sm:mb-12" style={{ color: COLORS.blanco }}>
              Tu asistente inteligente del<br />
              <span className="font-semibold">Centro de Informática USS</span>
            </p>
            
            <button 
              onClick={startChat}
              className="group font-bold text-base sm:text-lg px-8 sm:px-10 py-4 sm:py-5 rounded-2xl shadow-2xl hover:scale-105 sm:hover:scale-110 transition-all"
              style={{ 
                backgroundColor: COLORS.celeste,
                color: COLORS.blanco,
                border: `2px solid ${COLORS.verde}`,
                boxShadow: `0 10px 15px -3px rgba(99, 237, 18, 0.3)`
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = COLORS.celesteHover;
                e.target.style.boxShadow = `0 10px 15px -3px rgba(99, 237, 18, 0.5)`;
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = COLORS.celeste;
                e.target.style.boxShadow = `0 10px 15px -3px rgba(99, 237, 18, 0.3)`;
              }}
            >
              Comenzar Chat
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen w-full fixed inset-0" style={{ backgroundColor: COLORS.morado }}>
      <div className="flex h-full w-full md:max-w-6xl md:mx-auto relative z-10 md:my-4 md:rounded-2xl md:h-[calc(100vh-2rem)] overflow-hidden shadow-2xl">
        {/* Panel lateral del PDF - RESPONSIVE */}
        {showPdfGuide && (
          <div className={`fixed md:relative inset-0 md:inset-auto z-30 flex flex-col w-full md:w-96 bg-white shadow-xl transition-transform duration-300 ${
            showPdfGuide ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <div className="p-4 border-b flex justify-between items-center" style={{ backgroundColor: COLORS.morado }}>
              <h2 className="text-lg font-bold text-white">📚 Guía de Uso</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={togglePdfGuide}
                  className="p-1 hover:bg-white/20 rounded md:hidden"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
                <button 
                  onClick={togglePdfGuide}
                  className="p-1 hover:bg-white/20 rounded hidden md:block"
                  title="Ocultar guía"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <div className="mb-4 md:mb-6">
                <h3 className="text-lg md:text-xl font-bold mb-2" style={{ color: COLORS.morado }}>Cómo usar este Chatbot</h3>
                <p className="text-sm md:text-base text-gray-600 mb-4">Sigue esta guía para obtener la mejor experiencia:</p>
              </div>
              
              <div className="space-y-3 md:space-y-4">
                <div className="p-3 md:p-4 rounded-lg border" style={{ borderColor: COLORS.verde }}>
                  <div className="flex items-center gap-2 md:gap-3 mb-2">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.celeste }}>
                      <span className="text-xs md:text-base text-white font-bold">1</span>
                    </div>
                    <h4 className="font-bold text-sm md:text-base" style={{ color: COLORS.morado }}>Consulta directa</h4>
                  </div>
                  <p className="text-xs md:text-sm text-gray-600">Puedes escribir directamente lo que necesitas: "constancias", "certificados", "pagos", "cursos", etc.</p>
                </div>
                
                <div className="p-3 md:p-4 rounded-lg border" style={{ borderColor: COLORS.celeste }}>
                  <div className="flex items-center gap-2 md:gap-3 mb-2">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.verde }}>
                      <span className="text-xs md:text-base text-white font-bold">2</span>
                    </div>
                    <h4 className="font-bold text-sm md:text-base" style={{ color: COLORS.morado }}>Botones de acción</h4>
                  </div>
                  <p className="text-xs md:text-sm text-gray-600">Usa los botones para navegar rápidamente por las opciones principales del programa.</p>
                </div>
                
                <div className="p-3 md:p-4 rounded-lg border" style={{ borderColor: COLORS.morado }}>
                  <div className="flex items-center gap-2 md:gap-3 mb-2">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.morado }}>
                      <span className="text-xs md:text-base text-white font-bold">3</span>
                    </div>
                    <h4 className="font-bold text-sm md:text-base" style={{ color: COLORS.morado }}>Voz y texto</h4>
                  </div>
                  <p className="text-xs md:text-sm text-gray-600">Puedes usar el micrófono para dictar tu consulta o escribir manualmente.</p>
                </div>
                
                <div className="p-3 md:p-4 rounded-lg border" style={{ borderColor: COLORS.verde }}>
                  <div className="flex items-center gap-2 md:gap-3 mb-2">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.celeste }}>
                      <span className="text-xs md:text-base text-white font-bold">4</span>
                    </div>
                    <h4 className="font-bold text-sm md:text-base" style={{ color: COLORS.morado }}>Temas comunes</h4>
                  </div>
                  <ul className="text-xs md:text-sm text-gray-600 space-y-1">
                    <li>• <strong>Constancias:</strong> acempresariales@uss.edu.pe</li>
                    <li>• <strong>Cursos:</strong> Word, Excel, SPSS/Project (S/200 c/u)</li>
                    <li>• <strong>Pagos:</strong> Yape, BCP, Tarjeta</li>
                    <li>• <strong>Contacto:</strong> centrodeinformatica@uss.edu.pe</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 md:mt-8 p-3 md:p-4 rounded-lg" style={{ backgroundColor: COLORS.celeste + '20' }}>
                <h4 className="font-bold text-sm md:text-base mb-2" style={{ color: COLORS.morado }}>📋 Información importante</h4>
                <p className="text-xs md:text-sm text-gray-700">
                  Este chatbot está diseñado específicamente para el <strong>Programa de Computación para Egresados USS</strong>. 
                  Para otros trámites académicos, contacta directamente con las áreas correspondientes.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Chat principal */}
        <div className="flex-1 flex flex-col relative"
          style={{ backgroundColor: darkMode ? COLORS.grisOscuro : COLORS.blanco }}>
          
          {/* Header con botón para mostrar/ocultar guía - RESPONSIVE */}
          <div className={`p-3 sm:p-4 border-b flex justify-between items-center ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
            style={{ backgroundColor: darkMode ? COLORS.grisOscuro : COLORS.blanco }}>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-2"
              >
                <Menu className="w-5 h-5" style={{ color: darkMode ? COLORS.grisClaro : COLORS.grisOscuro }} />
              </button>
              <div className="relative">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: COLORS.verde }}>
                  <Bot className="w-5 h-5 sm:w-7 sm:h-7" style={{ color: COLORS.morado }} />
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2"
                  style={{ backgroundColor: COLORS.celeste, borderColor: COLORS.blanco }}></div>
              </div>
              <div className="flex-1">
                <h1 className="text-base sm:text-lg font-bold" style={{ color: darkMode ? COLORS.blanco : COLORS.grisOscuro }}>
                  Centro de Informática USS
                </h1>
                <p className="text-xs sm:text-sm font-medium" style={{ color: COLORS.celeste }}>En línea</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Botón para mostrar guía en móvil */}
              <button 
                onClick={togglePdfGuide}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors md:hidden"
                title="Mostrar guía"
              >
                <FileText className="w-5 h-5" style={{ 
                  color: darkMode ? COLORS.celeste : COLORS.morado 
                }} />
              </button>
              
              {/* Botón de guía con texto en desktop */}
              <button 
                onClick={togglePdfGuide}
                className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={showPdfGuide ? "Ocultar guía" : "Mostrar guía"}
              >
                <FileText className="w-4 h-4" style={{ 
                  color: darkMode ? COLORS.celeste : COLORS.morado 
                }} />
                <span className="text-sm font-medium" style={{ color: darkMode ? COLORS.grisClaro : COLORS.grisOscuro }}>
                  {showPdfGuide ? "Ocultar guía" : "Mostrar guía"}
                </span>
              </button>
              
              {/* Botón de tema con texto en desktop */}
              <button 
                onClick={toggleDarkMode}
                className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              >
                {darkMode ? (
                  <Sun className="w-4 h-4" style={{ color: COLORS.celeste }} />
                ) : (
                  <Moon className="w-4 h-4" style={{ color: COLORS.morado }} />
                )}
                <span className="text-sm font-medium" style={{ color: darkMode ? COLORS.grisClaro : COLORS.grisOscuro }}>
                  {darkMode ? "Modo claro" : "Modo oscuro"}
                </span>
              </button>
              
              {/* Solo iconos en móvil */}
              <button onClick={toggleDarkMode} className="md:hidden p-2">
                {darkMode ? (
                  <Sun className="w-5 h-5" style={{ color: COLORS.celeste }} />
                ) : (
                  <Moon className="w-5 h-5" style={{ color: COLORS.morado }} />
                )}
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className={`flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
            style={{ backgroundColor: darkMode ? '#1a1a1a' : COLORS.grisClaro }}>
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.type === 'bot' && (
                  <div className="flex items-start gap-2 sm:gap-3 max-w-[90%] sm:max-w-[85%]">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: COLORS.verde }}>
                      <Bot className="w-4 h-4 sm:w-6 sm:h-6" style={{ color: COLORS.morado }} />
                    </div>
                    <div>
                      <div className="rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-md"
                        style={{ 
                          backgroundColor: darkMode ? COLORS.grisOscuro : COLORS.blanco,
                          color: darkMode ? COLORS.grisClaro : COLORS.grisOscuro,
                          borderLeft: `3px solid ${COLORS.celeste}`
                        }}>
                        <div 
                          className="text-xs sm:text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: formatMessage(message.text) }}
                        />
                      </div>
                      
                      {/* Botones de respuesta rápida */}
                      {message.buttons && message.buttons.length > 0 && (
                        <div className="flex flex-wrap gap-1 sm:gap-2 mt-2 sm:mt-3">
                          {message.buttons.map((button, btnIndex) => (
                            <button
                              key={btnIndex}
                              onClick={() => handleButtonClick(button.value, button.text)}
                              className="px-2 py-1 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all hover:scale-105 shadow-md hover:shadow-lg"
                              style={{ 
                                backgroundColor: COLORS.celeste,
                                color: COLORS.blanco,
                                border: `1px solid ${COLORS.verde}`
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = COLORS.celesteHover;
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = COLORS.celeste;
                              }}
                            >
                              {button.text}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {message.type === 'user' && (
                  <div className="flex items-start gap-2 sm:gap-3 max-w-[90%] sm:max-w-[85%] flex-row-reverse">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: COLORS.verde }}>
                      <User className="w-4 h-4 sm:w-6 sm:h-6" style={{ color: COLORS.morado }} />
                    </div>
                    <div className="rounded-xl sm:rounded-2xl p-3 sm:p-4 text-xs sm:text-sm shadow-md"
                      style={{ 
                        backgroundColor: COLORS.morado,
                        color: COLORS.blanco,
                        borderRight: `3px solid ${COLORS.celeste}`
                      }}>
                      {message.text}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center animate-pulse"
                    style={{ backgroundColor: COLORS.verde }}>
                    <Bot className="w-4 h-4 sm:w-6 sm:h-6" style={{ color: COLORS.morado }} />
                  </div>
                  <div className="rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-md"
                    style={{ 
                      backgroundColor: darkMode ? COLORS.grisOscuro : COLORS.blanco,
                      borderLeft: `3px solid ${COLORS.celeste}`
                    }}>
                    <div className="flex gap-1 sm:gap-2">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-bounce" style={{ backgroundColor: COLORS.morado }}></div>
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-bounce" style={{ backgroundColor: COLORS.morado, animationDelay: '0.2s' }}></div>
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-bounce" style={{ backgroundColor: COLORS.morado, animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input - RESPONSIVE */}
          <div className="border-t p-3 sm:p-4"
            style={{ 
              backgroundColor: darkMode ? COLORS.grisOscuro : COLORS.blanco,
              borderColor: darkMode ? '#444' : '#e5e7eb'
            }}>
            <div className="flex items-end gap-2 sm:gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                rows={1}
                placeholder="Escribe aquí tu consulta..."
                className="flex-1 rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-3 focus:outline-none resize-none text-sm sm:text-base"
                style={{ 
                  backgroundColor: darkMode ? '#2a2a2a' : COLORS.grisClaro,
                  color: darkMode ? COLORS.grisClaro : COLORS.grisOscuro,
                  border: `2px solid ${COLORS.verde}`,
                  boxShadow: `0 0 0 1px ${COLORS.verde}40, inset 0 2px 4px 0 rgba(0,0,0,0.05)`
                }}
              />
              
              {input.trim() && (
                <button
                  onClick={() => handleSend()}
                  disabled={isLoading}
                  className="p-2 sm:p-3 rounded-full hover:scale-105 transition-all shadow-md flex-shrink-0"
                  style={{ 
                    backgroundColor: COLORS.celeste,
                    color: COLORS.blanco
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = COLORS.celesteHover;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = COLORS.celeste;
                  }}
                >
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
              
              <button 
                onClick={toggleVoiceRecognition}
                className="p-2 sm:p-3 rounded-full hover:scale-105 transition-all shadow-md flex-shrink-0"
                style={{ 
                  backgroundColor: COLORS.verde,
                  border: isListening ? `2px solid ${COLORS.celeste}` : 'none'
                }}
              >
                <Mic className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: COLORS.morado }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
