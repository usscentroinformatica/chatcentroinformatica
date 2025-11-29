import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Moon, Sun, Mic, CheckCircle, XCircle } from 'lucide-react';

function App() {
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [showSplash, setShowSplash] = useState(true);
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

  const API_URL = process.env.NODE_ENV === 'production' ? '/api/chat' : 'http://localhost:5000/api/chat';

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
    formatted = formatted.replace(/^\* (.+)$/gm, '<span class="flex items-start gap-2 my-1"><span class="text-blue-600 dark:text-blue-400 font-bold">•</span><span>$1</span></span>');
    formatted = formatted.replace(/^(\d+)\. (.+)$/gm, '<span class="flex items-start gap-2 my-1"><span class="text-blue-600 dark:text-blue-400 font-bold">$1.</span><span>$2</span></span>');
    formatted = formatted.replace(/\n\n/g, '<br/><br/>');
    formatted = formatted.replace(/\n/g, '<br/>');
    return formatted;
  };

  const handleButtonClick = async (buttonValue, buttonText) => {
    // Agregar mensaje del usuario con el botón presionado
    const userMessage = { type: 'user', text: buttonText };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Procesar según el flujo
    let botResponse = '';
    let nextButtons = [];

    try {
      switch (buttonValue) {
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
          
          botResponse = `Has seleccionado: **${cursos[cursoNumero].nombre}**\n${cursos[cursoNumero].contenido}\n\n💰 Costo: S/ 200\n📚 100% Virtual\n⏰ Acceso 24/7\n📝 4 evaluaciones de 30 min c/u\n\n¿Deseas continuar con el proceso de inscripción?`;
          nextButtons = [
            { text: '✅ Sí, continuar con inscripción', value: 'ver_proceso' },
            { text: '🔄 Elegir otro curso', value: 'cambiar_curso' },
            { text: 'ℹ️ Más información del curso', value: 'info_curso_detalle' }
          ];
          break;

        case 'info_cursos':
          botResponse = `📚 **CURSOS DISPONIBLES**\n\n**Computación 1** (S/ 200)\n• Microsoft Word Intermedio-Avanzado\n• Formato avanzado, estilos, plantillas\n• Tablas de contenido\n• Control de cambios\n\n**Computación 2** (S/ 200)\n• Microsoft Excel Básico-Avanzado\n• Fórmulas y funciones\n• Tablas dinámicas\n• Macros básicas\n\n**Computación 3** (S/ 200)\n• IBM SPSS (análisis estadístico)\n• MS Project (gestión de proyectos)\n\n¿En cuál estás interesado?`;
          nextButtons = [
            { text: 'Computación 1', value: 'curso_1' },
            { text: 'Computación 2', value: 'curso_2' },
            { text: 'Computación 3', value: 'curso_3' }
          ];
          break;

        case 'ver_proceso':
          setCurrentStep('proceso_inscripcion');
          botResponse = `📋 **PROCESO DE INSCRIPCIÓN**\n\n1️⃣ Ingresa al Campus USS con tus credenciales\n2️⃣ Ve a "Trámites"\n3️⃣ Selecciona "PROGRAMACIÓN DE SERVICIOS"\n4️⃣ Elige "PROGRAMA DE COMPUTACIÓN PARA EGRESADOS USS"\n5️⃣ Haz clic en "Programar"\n6️⃣ Realiza el pago de S/ 200\n7️⃣ Envía el comprobante a:\n📧 centrodeinformatica@uss.edu.pe\n\n¿Necesitas información sobre los métodos de pago?`;
          nextButtons = [
            { text: '💳 Ver métodos de pago', value: 'metodos_pago' },
            { text: '✅ Todo claro, gracias', value: 'finalizar' },
            { text: '❓ Tengo una duda', value: 'escribir_duda' }
          ];
          break;

        case 'metodos_pago':
          botResponse = `💳 **MÉTODOS DE PAGO**\n\n1. **Campus Virtual - Gestión Financiera**\n   • Tarjeta Visa/Mastercard\n   • Billetera digital / QR\n\n2. **Yape**\n   • Servicios programables\n   • Ingresa tu código de alumno\n\n3. **Aplicativo BCP**\n   • Pagar servicios\n   • "Servicios Programables"\n   • Se refleja en 3-5 horas\n\n4. **Agente/Agencia BCP**\n   • Cuenta: 305-1552328-0-87\n   • Se refleja en hasta 24 horas\n\n¿Te queda alguna duda?`;
          nextButtons = [
            { text: '✅ Todo claro', value: 'finalizar' },
            { text: '🔄 Ver proceso nuevamente', value: 'ver_proceso' },
            { text: '❓ Hacer una pregunta', value: 'escribir_duda' }
          ];
          break;

        case 'cambiar_curso':
          setCurrentStep('seleccion_curso');
          botResponse = '¿En qué curso estás interesado?';
          nextButtons = [
            { text: 'Computación 1 - Word', value: 'curso_1' },
            { text: 'Computación 2 - Excel', value: 'curso_2' },
            { text: 'Computación 3 - SPSS/Project', value: 'curso_3' }
          ];
          break;

        case 'finalizar':
          botResponse = `¡Perfecto, ${userData.nombre}! 🎉\n\nResumen de tu consulta:\n✅ Curso: ${userData.cursoSeleccionado}\n💰 Costo: S/ 200\n\nRecuerda:\n📧 centrodeinformatica@uss.edu.pe\n📞 986 724 506\n\n¿Hay algo más en lo que pueda ayudarte?`;
          nextButtons = [
            { text: 'No, eso es todo. Gracias', value: 'despedida' },
            { text: 'Tengo otra consulta', value: 'otra_consulta' }
          ];
          break;

        case 'despedida':
          botResponse = '¡Excelente! Gracias por contactarnos. ¡Éxitos en tu curso! 🎓\n\nSi necesitas más ayuda, no dudes en escribirnos.';
          break;

        case 'otra_consulta':
          botResponse = '¿En qué más puedo ayudarte? Escribe tu consulta:';
          setCurrentStep('consulta_libre');
          break;

        case 'escribir_duda':
          botResponse = 'Por favor, escribe tu duda en el cuadro de texto y te ayudaré a resolverla:';
          setCurrentStep('consulta_libre');
          break;

        default:
          // Para botones personalizados o flujos especiales
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
      // Lógica especial según el paso actual
      if (currentStep === 'esperando_nombre') {
        // Guardar nombre y pedir correo
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
        // Validar formato de correo
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

      // Consulta libre - enviar al backend
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
        const botMessage = { type: 'bot', text: data.response };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error(data.error || 'Error en la respuesta');
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = { 
        type: 'bot', 
        text: 'Lo siento, hubo un problema. Contacta a:\n📧 centrodeinformatica@uss.edu.pe\n📱 986 724 506' 
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

  if (showSplash) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-green-700">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
          <div className="text-center max-w-md mx-auto">
            <div className="relative mb-12">
              <div className="relative w-32 h-32 mx-auto">
                <div className="w-full h-full rounded-full bg-white shadow-2xl border-4 border-green-500/50 flex items-center justify-center">
                  <Bot className="w-16 h-16 text-green-700 animate-bounce" />
                </div>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-black text-white mb-3 drop-shadow-2xl">
              Asistente USS
            </h1>
            
            <p className="text-green-100 text-xl font-light mb-12">
              Tu asistente inteligente del<br />
              <span className="font-semibold text-white">Centro de Informática USS</span>
            </p>
            
            <button 
              onClick={startChat}
              className="group bg-white hover:bg-green-50 text-green-700 font-bold text-lg px-10 py-5 rounded-2xl shadow-2xl hover:scale-110 transition-all"
            >
              Comenzar Chat
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-green-700 to-green-800'
    }`}>
      <div className={`flex flex-col h-screen max-w-4xl mx-auto relative z-10 ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      } md:my-4 md:rounded-2xl md:h-[calc(100vh-2rem)] overflow-hidden shadow-2xl`}>
        
        {/* Header */}
        <div className={`p-4 border-b ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-green-700 flex items-center justify-center">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex-1">
              <h1 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Centro de Informática USS
              </h1>
              <p className="text-sm text-green-500 font-medium">En línea</p>
            </div>
            <button onClick={toggleDarkMode} className="p-2">
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.type === 'bot' && (
                <div className="flex items-start gap-3 max-w-[85%]">
                  <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className={`rounded-2xl p-4 ${
                      darkMode ? 'bg-gray-700 text-gray-100' : 'bg-white text-gray-800'
                    }`}>
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
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 ${
                              darkMode 
                                ? 'bg-green-600 hover:bg-green-500 text-white' 
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            } shadow-md hover:shadow-lg`}
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
                  <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="bg-green-700 rounded-2xl p-4 text-white text-sm">
                    {message.text}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center animate-pulse">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className={`rounded-2xl p-4 ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={`border-t p-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              rows={1}
              placeholder="Escribe aquí..."
              className={`flex-1 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-300 resize-none ${
                darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
              }`}
            />
            
            {input.trim() && (
              <button
                onClick={() => handleSend()}
                disabled={isLoading}
                className="bg-green-600 text-white p-3 rounded-full hover:bg-green-700 transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            )}
            
            <button 
              onClick={toggleVoiceRecognition}
              className={`p-3 rounded-full ${
                isListening ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
