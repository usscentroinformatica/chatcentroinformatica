import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Moon, Sun, Mic, CheckCircle, XCircle, Volume2, VolumeX } from 'lucide-react';

function App() {
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [showSplash, setShowSplash] = useState(true);
  const [showIntro, setShowIntro] = useState(true); // Nueva variable para controlar la intro
  const [isPlaying, setIsPlaying] = useState(true); // Para controlar la voz
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

  // Definición de colores actualizados
  const COLORS = {
    morado: '#5a2290',      // Fondo principal
    celeste: '#11acd3',     // Botón Comenzar Chat
    verde: '#63ed12',       // Fondo del icono
    moradoIcono: '#5a2290', // Icono en sí (color del ícono)
    verdeHover: '#4ac010',  // Hover del botón verde
    celesteHover: '#0e9abf', // Hover del botón celeste
    blanco: '#ffffff',
    grisClaro: '#f0f0f0',
    grisOscuro: '#333333'
  };

  const API_URL = process.env.NODE_ENV === 'production' ? '/api/chat' : 'http://localhost:5000/api/chat';

  useEffect(() => {
    // Si estamos en la intro, reproducir la voz después de un breve delay
    if (showIntro && showSplash) {
      const timer = setTimeout(() => {
        // Crear síntesis de voz
        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance();
        
        // Configurar la voz
        utterance.text = "Bienvenidos al chatbot del Centro de Informática. Aquí podrás despejar tus dudas sobre los cursos de computación que tengas pendiente.";
        utterance.lang = 'es-ES';
        utterance.rate = 1.0; // Velocidad normal
        utterance.pitch = 1.0; // Tono normal
        utterance.volume = 1.0; // Volumen máximo
        
        // Cuando termine de hablar, iniciar animación de alejamiento
        utterance.onend = () => {
          setIsPlaying(false);
          // Esperar 1 segundo antes de iniciar la animación de alejamiento
          setTimeout(() => {
            setShowIntro(false);
          }, 1000);
        };
        
        // Reproducir la voz
        synth.speak(utterance);
        setIsPlaying(true);
      }, 1000); // Esperar 1 segundo antes de empezar a hablar
      
      return () => clearTimeout(timer);
    }
  }, [showIntro, showSplash]);

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
        text: 'Lo siento, hubo un error. Por favor intenta nuevamente.'
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

  const skipIntro = () => {
    // Detener la voz si está reproduciéndose
    window.speechSynthesis.cancel();
    setShowIntro(false);
  };

  if (showSplash) {
    return (
      <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: COLORS.morado }}>
        {/* Animación de partículas en el fondo */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i}
              className="absolute rounded-full animate-pulse"
              style={{
                width: `${Math.random() * 100 + 50}px`,
                height: `${Math.random() * 100 + 50}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                backgroundColor: COLORS.celeste,
                opacity: Math.random() * 0.1 + 0.05,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${Math.random() * 3 + 2}s`
              }}
            />
          ))}
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
          {/* ANIMACIÓN DE INTRODUCCIÓN */}
          {showIntro ? (
            <div className="text-center max-w-4xl mx-auto">
              {/* Icono grande con animación */}
              <div className={`relative ${isPlaying ? 'animate-pulse' : ''}`}>
                <div className="relative w-64 h-64 mx-auto mb-12">
                  <div 
                    className={`w-full h-full rounded-full flex items-center justify-center transition-all duration-1000 ease-in-out ${
                      !isPlaying ? 'scale-75' : ''
                    }`}
                    style={{ 
                      backgroundColor: COLORS.verde,
                      border: `8px solid ${COLORS.celeste}`,
                      boxShadow: `
                        0 0 60px ${COLORS.celeste}80,
                        0 0 120px ${COLORS.celeste}40,
                        0 0 180px ${COLORS.celeste}20,
                        inset 0 0 60px ${COLORS.blanco}20
                      `
                    }}
                  >
                    <Bot 
                      className={`transition-all duration-1000 ease-in-out ${
                        !isPlaying ? 'w-24 h-24' : 'w-32 h-32'
                      }`}
                      style={{ 
                        color: COLORS.morado,
                        filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.5))'
                      }}
                    />
                  </div>
                  
                  {/* Anillos concéntricos animados */}
                  {isPlaying && (
                    <>
                      <div 
                        className="absolute inset-0 rounded-full border-4 border-celeste animate-ping"
                        style={{ 
                          borderColor: COLORS.celeste,
                          animationDuration: '2s'
                        }}
                      />
                      <div 
                        className="absolute inset-[-20px] rounded-full border-2 border-verde animate-ping"
                        style={{ 
                          borderColor: COLORS.verde,
                          animationDuration: '3s',
                          animationDelay: '0.5s'
                        }}
                      />
                    </>
                  )}
                </div>
                
                {/* Indicador de sonido */}
                <div className="absolute top-4 right-4 animate-bounce">
                  <Volume2 className="w-8 h-8" style={{ color: COLORS.blanco }} />
                </div>
              </div>
              
              {/* Texto de bienvenida que aparece suavemente */}
              <div className={`mb-12 transition-all duration-1000 delay-500 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}>
                <h1 className="text-6xl md:text-7xl font-black mb-6" style={{ 
                  color: COLORS.blanco,
                  textShadow: `0 5px 15px rgba(0, 0, 0, 0.3)`
                }}>
                  Bienvenidos
                </h1>
                <p className="text-2xl md:text-3xl font-light max-w-2xl mx-auto" style={{ 
                  color: COLORS.blanco,
                  lineHeight: '1.6'
                }}>
                  al chatbot del Centro de Informática
                </p>
              </div>
              
              {/* Botón para saltar intro */}
              <button 
                onClick={skipIntro}
                className="mt-8 px-6 py-3 rounded-full text-sm font-medium opacity-70 hover:opacity-100 transition-opacity"
                style={{ 
                  backgroundColor: COLORS.celeste,
                  color: COLORS.blanco
                }}
              >
                Saltar introducción
              </button>
            </div>
          ) : (
            /* PANTALLA NORMAL DESPUÉS DE LA INTRO */
            <div className="text-center max-w-md mx-auto animate-fadeIn">
              <div className="relative mb-12">
                <div className="relative w-32 h-32 mx-auto">
                  <div 
                    className="w-full h-full rounded-full flex items-center justify-center"
                    style={{ 
                      backgroundColor: COLORS.verde,
                      border: `4px solid ${COLORS.morado}`,
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}
                  >
                    <Bot 
                      className="w-16 h-16 animate-bounce" 
                      style={{ color: COLORS.morado }}
                    />
                  </div>
                </div>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-black mb-3 drop-shadow-2xl" style={{ color: COLORS.blanco }}>
                Asistente USS
              </h1>
              
              <p className="text-xl font-light mb-12" style={{ color: COLORS.blanco }}>
                Tu asistente inteligente del<br />
                <span className="font-semibold">Centro de Informática USS</span>
              </p>
              
              <button 
                onClick={startChat}
                className="group font-bold text-lg px-10 py-5 rounded-2xl shadow-2xl hover:scale-110 transition-all"
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
          )}
        </div>
      </div>
    );
  }

  // Resto del código del chat (sin cambios)
  return (
    <div className="min-h-screen h-screen w-full fixed inset-0" style={{ backgroundColor: COLORS.morado }}>
      <div className="flex flex-col h-full w-full md:h-screen md:max-w-4xl md:mx-auto relative z-10 md:my-4 md:rounded-2xl md:h-[calc(100vh-2rem)] overflow-hidden shadow-2xl"
        style={{ backgroundColor: darkMode ? COLORS.grisOscuro : COLORS.blanco }}>
        
        {/* Header */}
        <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
          style={{ backgroundColor: darkMode ? COLORS.grisOscuro : COLORS.blanco }}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: COLORS.verde }}>
                <Bot className="w-7 h-7" style={{ color: COLORS.morado }} />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2"
                style={{ backgroundColor: COLORS.celeste, borderColor: COLORS.blanco }}></div>
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold" style={{ color: darkMode ? COLORS.blanco : COLORS.grisOscuro }}>
                Centro de Informática USS
              </h1>
              <p className="text-sm font-medium" style={{ color: COLORS.celeste }}>En línea</p>
            </div>
            <button onClick={toggleDarkMode} className="p-2">
              {darkMode ? (
                <Sun className="w-5 h-5" style={{ color: COLORS.celeste }} />
              ) : (
                <Moon className="w-5 h-5" style={{ color: COLORS.morado }} />
              )}
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
          style={{ backgroundColor: darkMode ? '#1a1a1a' : COLORS.grisClaro }}>
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.type === 'bot' && (
                <div className="flex items-start gap-3 max-w-[85%]">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: COLORS.verde }}>
                    <Bot className="w-6 h-6" style={{ color: COLORS.morado }} />
                  </div>
                  <div>
                    <div className="rounded-2xl p-4 shadow-md"
                      style={{ 
                        backgroundColor: darkMode ? COLORS.grisOscuro : COLORS.blanco,
                        color: darkMode ? COLORS.grisClaro : COLORS.grisOscuro,
                        borderLeft: `4px solid ${COLORS.celeste}`
                      }}>
                      <div 
                        className="text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: formatMessage(message.text) }}
                      />
                    </div>
                    
                    {/* Botones de respuesta rápida */}
                    {message.buttons && message.buttons.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {message.buttons.map((button, btnIndex) => (
                          <button
                            key={btnIndex}
                            onClick={() => handleButtonClick(button.value, button.text)}
                            className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 shadow-md hover:shadow-lg"
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
                <div className="flex items-start gap-3 max-w-[85%] flex-row-reverse">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: COLORS.verde }}>
                    <User className="w-6 h-6" style={{ color: COLORS.morado }} />
                  </div>
                  <div className="rounded-2xl p-4 text-sm shadow-md"
                    style={{ 
                      backgroundColor: COLORS.morado,
                      color: COLORS.blanco,
                      borderRight: `4px solid ${COLORS.celeste}`
                    }}>
                    {message.text}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center animate-pulse"
                  style={{ backgroundColor: COLORS.verde }}>
                  <Bot className="w-6 h-6" style={{ color: COLORS.morado }} />
                </div>
                <div className="rounded-2xl p-4 shadow-md"
                  style={{ 
                    backgroundColor: darkMode ? COLORS.grisOscuro : COLORS.blanco,
                    borderLeft: `4px solid ${COLORS.celeste}`
                  }}>
                  <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: COLORS.morado }}></div>
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: COLORS.morado, animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: COLORS.morado, animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-4"
          style={{ 
            backgroundColor: darkMode ? COLORS.grisOscuro : COLORS.blanco,
            borderColor: darkMode ? '#444' : '#e5e7eb'
          }}>
          <div className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              rows={1}
              placeholder="Escribe aquí..."
              className="flex-1 rounded-2xl px-4 py-3 focus:outline-none resize-none"
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
                className="p-3 rounded-full hover:scale-105 transition-all shadow-md"
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
                <Send className="w-5 h-5" />
              </button>
            )}
            
            <button 
              onClick={toggleVoiceRecognition}
              className="p-3 rounded-full hover:scale-105 transition-all shadow-md"
              style={{ 
                backgroundColor: COLORS.verde,
                border: isListening ? `2px solid ${COLORS.celeste}` : 'none'
              }}
            >
              <Mic className="w-5 h-5" style={{ color: COLORS.morado }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
