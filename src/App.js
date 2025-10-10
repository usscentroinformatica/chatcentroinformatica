import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Moon, Sun } from 'lucide-react';

function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [welcomeStep, setWelcomeStep] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  const [messages, setMessages] = useState([
    { type: 'bot', text: '¡Hola! 👋 Soy Camilito, tu asistente del Centro de Informática USS.\n\n¿En qué puedo ayudarte hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const messagesEndRef = useRef(null);

  const API_URL = '/api/chat';

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

  const speakMessage = (text) => {
    if ('speechSynthesis' in window && audioEnabled) {
      speechSynthesis.cancel();
      
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 0.9;
        utterance.pitch = 1.2;
        utterance.volume = 1.0;
        
        speechSynthesis.speak(utterance);
      }, 100);
    }
  };

  useEffect(() => {
    if (!showWelcome) return;

    const timer1 = setTimeout(() => {
      setWelcomeStep(1);
      speakMessage("¡Hola! Bienvenidos al Centro de Informática de la Universidad Señor de Sipán. Soy tu amigo Camilito. Este chat es para egresados hasta el año dos mil veintitrés guión dos. ¡Empecemos!");
    }, 1000);

    const timer2 = setTimeout(() => setWelcomeStep(2), 7000);
    const timer3 = setTimeout(() => {
      setWelcomeStep(3);
      setShowWelcome(false);
    }, 8500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
    };
  }, [showWelcome]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
  };

  const formatMessage = (text) => {
    let formatted = text.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold">$1</strong>');
    formatted = formatted.replace(/^\* (.+)$/gm, '<span class="flex items-start gap-2 my-1"><span class="text-blue-600 dark:text-blue-400 font-bold">•</span><span>$1</span></span>');
    formatted = formatted.replace(/^(\d+)\. (.+)$/gm, '<span class="flex items-start gap-2 my-1"><span class="text-blue-600 dark:text-blue-400 font-bold">$1.</span><span>$2</span></span>');
    formatted = formatted.replace(/^([1-9]️⃣) (.+)$/gm, '<span class="flex items-start gap-2 my-2"><span class="text-xl">$1</span><span>$2</span></span>');
    formatted = formatted.replace(/^### (.+)$/gm, '<h3 class="font-bold text-lg mt-3 mb-1 text-blue-700 dark:text-blue-300">$1</h3>');
    formatted = formatted.replace(/^## (.+)$/gm, '<h2 class="font-bold text-xl mt-3 mb-2 text-blue-800 dark:text-blue-200">$1</h2>');
    formatted = formatted.replace(/\n\n/g, '<br/><br/>');
    formatted = formatted.replace(/\n/g, '<br/>');
    return formatted;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { type: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();

      if (response.ok) {
        const botMessage = { type: 'bot', text: data.response };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error(data.error || 'Error en la respuesta');
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = { 
        type: 'bot', 
        text: 'Lo siento, hubo un problema al procesar tu consulta.\n\nContacta a:\n📧 centrodeinformatica@uss.edu.pe\n📱 986 724 506' 
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

  const quickButtons = [
    { label: '¿Puedo inscribirme?', query: 'Soy egresado, ¿puedo inscribirme?' },
    { label: 'Computación 3', query: 'Necesito información de Computación 3' },
    { label: '¿Cómo pago?', query: '¿Cómo realizo el pago desde campus virtual?' },
    { label: 'Contacto', query: 'Necesito datos de contacto' }
  ];

  const handleQuickButton = (query) => {
    setInput(query);
  };

  // Robot 3D completo con cuerpo y piernas - MEJORADO
  const RobotComplete = ({ size = 'large', animate = false }) => {
    const isLarge = size === 'large';
    const scale = isLarge ? 1 : 0.4;
    
    return (
      <div className={`relative ${animate ? 'animate-bounce-slow' : ''}`} style={{
        transform: `scale(${scale})`,
        transformOrigin: 'center center'
      }}>
        {/* Sombra base */}
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black/20 rounded-full blur-xl"></div>
        
        {/* Antena */}
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
          <div className="w-1 h-8 bg-gradient-to-b from-blue-400 to-blue-600"></div>
          <div className="w-3 h-3 bg-red-500 rounded-full shadow-lg animate-pulse"></div>
        </div>
        
        {/* Cabeza del robot */}
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-700 rounded-2xl shadow-2xl border-4 border-blue-300 transform rotate-3">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent rounded-2xl"></div>
            
            {/* Ojos */}
            <div className="absolute top-6 left-3 flex gap-3">
              <div className="relative">
                <div className="w-6 h-6 bg-white rounded-full shadow-inner"></div>
                <div className={`absolute top-1 left-1 w-4 h-4 bg-blue-600 rounded-full ${animate ? 'animate-ping' : ''}`}></div>
              </div>
              <div className="relative">
                <div className="w-6 h-6 bg-white rounded-full shadow-inner"></div>
                <div className={`absolute top-1 left-1 w-4 h-4 bg-blue-600 rounded-full ${animate ? 'animate-ping' : ''}`}></div>
              </div>
            </div>
            
            {/* Boca/Pantalla */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-14 h-3 bg-gray-800 rounded-full border-2 border-gray-600">
              {animate && (
                <div className="absolute inset-0 flex items-center justify-center gap-0.5">
                  <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                  <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                </div>
              )}
            </div>
          </div>
          
          {/* Orejas/Auriculares */}
          <div className="absolute top-8 -left-4 w-4 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-l-full border-2 border-blue-400"></div>
          <div className="absolute top-8 -right-4 w-4 h-8 bg-gradient-to-l from-blue-500 to-blue-600 rounded-r-full border-2 border-blue-400"></div>
        </div>
        
        {/* Cuello */}
        <div className="w-8 h-4 mx-auto bg-gradient-to-b from-blue-600 to-blue-700 border-x-2 border-blue-400"></div>
        
        {/* Cuerpo */}
        <div className="relative w-32 h-36 mx-auto bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-3xl shadow-2xl border-4 border-blue-300">
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent rounded-3xl"></div>
          
          {/* Panel central */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-20 h-24 bg-gray-800 rounded-2xl border-2 border-gray-600 overflow-hidden">
            <div className="absolute inset-2 bg-gradient-to-br from-blue-900 to-indigo-900 rounded-xl">
              <div className="absolute top-2 left-2 flex gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" style={{animationDelay: '0.6s'}}></div>
              </div>
              
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                <Bot className="w-8 h-8 text-blue-400" />
              </div>
            </div>
          </div>
          
          {/* Brazo izquierdo */}
          <div className="absolute top-8 -left-6 w-6 h-20 bg-gradient-to-b from-blue-500 to-blue-700 rounded-full border-2 border-blue-400 transform -rotate-12"></div>
          <div className="absolute top-28 -left-7 w-5 h-5 bg-blue-400 rounded-full border-2 border-blue-300 shadow-lg"></div>
          
          {/* Brazo derecho con mano saludando */}
          <div className="absolute top-8 -right-6 w-6 h-20 bg-gradient-to-b from-blue-500 to-blue-700 rounded-full border-2 border-blue-400 transform rotate-12"></div>
          <div className="absolute top-28 -right-7 w-5 h-5 bg-blue-400 rounded-full border-2 border-blue-300 shadow-lg"></div>
          
          {/* Manita saludando con animación */}
          {isLarge && (
            <div className={`absolute top-24 -right-12 text-3xl ${animate ? 'animate-wave' : ''}`} style={{
              filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))',
              transformOrigin: 'bottom center'
            }}>
              👋
            </div>
          )}
        </div>
        
        {/* Cadera */}
        <div className="w-28 h-3 mx-auto bg-gradient-to-b from-blue-700 to-gray-700 border-x-2 border-blue-400"></div>
        
        {/* Piernas */}
        <div className="flex gap-4 justify-center mt-1">
          <div className="relative">
            <div className="w-8 h-16 bg-gradient-to-b from-gray-700 to-gray-800 rounded-b-xl border-2 border-gray-600">
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-6 h-2 bg-gray-600 rounded-full"></div>
            </div>
            <div className="relative -mt-1">
              <div className="w-10 h-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-b-xl rounded-tr-xl border-2 border-gray-700 shadow-lg"></div>
              <div className="absolute bottom-0 left-0 w-10 h-2 bg-black/30 rounded-full"></div>
            </div>
          </div>
          
          <div className="relative">
            <div className="w-8 h-16 bg-gradient-to-b from-gray-700 to-gray-800 rounded-b-xl border-2 border-gray-600">
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-6 h-2 bg-gray-600 rounded-full"></div>
            </div>
            <div className="relative -mt-1">
              <div className="w-10 h-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-b-xl rounded-tl-xl border-2 border-gray-700 shadow-lg"></div>
              <div className="absolute bottom-0 left-0 w-10 h-2 bg-black/30 rounded-full"></div>
            </div>
          </div>
        </div>
        
        {/* Ondas de sonido cuando habla */}
        {animate && isLarge && (
          <>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-4 border-yellow-300/40 rounded-full animate-ping"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-56 h-56 border-4 border-green-300/30 rounded-full animate-ping" style={{animationDelay: '0.3s'}}></div>
          </>
        )}
      </div>
    );
  };

  return (
    <>
      <style>{`
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(25deg); }
          40% { transform: rotate(-20deg); }
          60% { transform: rotate(25deg); }
          80% { transform: rotate(-20deg); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-wave {
          animation: wave 1.5s ease-in-out infinite;
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
      
      {/* Animación de bienvenida */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 overflow-hidden">
          {/* Partículas de fondo */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-20 w-32 h-32 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-40 h-40 bg-blue-300/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-indigo-300/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '0.5s'}}></div>
          </div>
          
          {/* Robot Camilito completo */}
          <div className={`relative transition-all duration-1000 ease-in-out ${
            welcomeStep === 0 ? 'scale-0 opacity-0' : 
            welcomeStep === 1 ? 'scale-100 opacity-100' :
            welcomeStep === 2 ? 'scale-50 translate-x-[40vw] translate-y-[35vh]' :
            'scale-25 translate-x-[45vw] translate-y-[40vh] opacity-0'
          }`}>
            <RobotComplete size="large" animate={welcomeStep === 1} />
          </div>
          
          {/* Indicador de que está hablando */}
          {welcomeStep === 1 && (
            <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 text-center text-white">
              <div className="flex items-center justify-center space-x-2 bg-black/30 backdrop-blur-md rounded-full px-8 py-4 shadow-xl border border-white/10">
                <div className="w-2.5 h-2.5 bg-white rounded-full animate-bounce"></div>
                <div className="w-2.5 h-2.5 bg-white rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></div>
                <div className="w-2.5 h-2.5 bg-white rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
                <span className="ml-4 text-base font-semibold">Camilito está hablando...</span>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Camilito pequeño en la esquina */}
      {!showWelcome && (
        <div className="fixed bottom-6 right-6 z-40 cursor-pointer hover:scale-110 transition-transform duration-200">
          <RobotComplete size="small" />
        </div>
      )}

      {/* Interfaz principal del chat */}
      <div className={`flex flex-col h-screen max-w-4xl mx-auto transition-colors duration-300 ${
        darkMode 
          ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
          : 'bg-gradient-to-br from-blue-50 to-indigo-50'
      } ${showWelcome ? 'pointer-events-none opacity-0' : 'pointer-events-auto opacity-100'}`}>
        
        {/* Header */}
        <div className={`p-6 shadow-lg transition-colors duration-300 ${
          darkMode
            ? 'bg-gradient-to-r from-gray-800 to-gray-700 text-white'
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">Asistente USS</h1>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-blue-100'}`}>
                  Programa de Computación para Egresados
                </p>
              </div>
            </div>
            
            {/* Controles */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={`p-3 rounded-full transition-all duration-300 ${
                  darkMode
                    ? 'bg-gray-600 hover:bg-gray-500'
                    : 'bg-white/20 hover:bg-white/30'
                } ${audioEnabled ? 'text-green-300' : 'text-red-300'}`}
                title={audioEnabled ? 'Desactivar audio' : 'Activar audio'}
              >
                {audioEnabled ? '🔊' : '🔇'}
              </button>
              
              <button
                onClick={toggleDarkMode}
                className={`p-3 rounded-full transition-all duration-300 ${
                  darkMode
                    ? 'bg-gray-600 hover:bg-gray-500 text-yellow-300'
                    : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
                title={darkMode ? 'Modo claro' : 'Modo oscuro'}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => (
            <div key={index}>
              <div className={`flex items-start gap-3 ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  message.type === 'user'
                    ? darkMode 
                      ? 'bg-blue-600 text-white'
                      : 'bg-indigo-600 text-white'
                    : darkMode
                      ? 'bg-gray-700 text-blue-400 shadow-lg'
                      : 'bg-white text-blue-600 shadow-md'
                }`}>
                  {message.type === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                <div className={`max-w-2xl p-4 rounded-2xl shadow-sm transition-colors duration-300 ${
                  message.type === 'user'
                    ? darkMode
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-indigo-600 text-white rounded-tr-none'
                    : darkMode
                      ? 'bg-gray-700 text-gray-100 rounded-tl-none shadow-lg'
                      : 'bg-gradient-to-br from-blue-50 to-indigo-50 text-gray-800 rounded-tl-none border-2 border-blue-200 shadow-md'
                }`}>
                  <div 
                    className="leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatMessage(message.text) }}
                  />
                </div>
              </div>
              
              {index === 0 && message.type === 'bot' && (
                <div className="flex flex-wrap gap-2 mt-3 ml-14">
                  {quickButtons.map((button, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickButton(button.query)}
                      className={`px-4 py-2 rounded-full text-sm transition-all duration-300 shadow-sm ${
                        darkMode
                          ? 'bg-gray-700 text-blue-300 hover:bg-gray-600'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {button.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                darkMode ? 'bg-gray-700 text-blue-400 shadow-lg' : 'bg-white text-blue-600 shadow-md'
              }`}>
                <Bot className="w-5 h-5" />
              </div>
              <div className={`p-4 rounded-2xl rounded-tl-none shadow-sm ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                <div className="flex gap-2">
                  <div className={`w-2 h-2 rounded-full animate-bounce ${darkMode ? 'bg-blue-400' : 'bg-blue-600'}`} style={{animationDelay: '0ms'}}></div>
                  <div className={`w-2 h-2 rounded-full animate-bounce ${darkMode ? 'bg-blue-400' : 'bg-blue-600'}`} style={{animationDelay: '150ms'}}></div>
                  <div className={`w-2 h-2 rounded-full animate-bounce ${darkMode ? 'bg-blue-400' : 'bg-blue-600'}`} style={{animationDelay: '300ms'}}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className={`border-t p-4 shadow-lg transition-colors duration-300 ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="max-w-4xl mx-auto flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              placeholder="Escribe tu consulta aquí..."
              className={`flex-1 p-3 border-2 rounded-full focus:outline-none transition-all duration-300 font-medium ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 shadow-sm'
                  : 'bg-white border-gray-400 text-gray-900 placeholder-gray-500 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/20 shadow-md hover:border-gray-500 hover:shadow-lg'
              } disabled:opacity-50 disabled:bg-gray-200 disabled:cursor-not-allowed`}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className={`p-3 rounded-full transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                darkMode
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;