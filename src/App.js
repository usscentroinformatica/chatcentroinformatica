import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Moon, Sun, Mic } from 'lucide-react';

function App() {
  // Generar sessionId único en cada recarga (F5 = sesión nueva)
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [showSplash, setShowSplash] = useState(true);
  const [messages, setMessages] = useState([
    { type: 'bot', text: '¡Hola! 👋 Bienvenido al Centro de Informática de la Universidad Señor de Sipán. Soy tu asistente virtual y estoy aquí para ayudarte con consultas sobre nuestros servicios informáticos. ¿En qué puedo asistirte?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const messagesEndRef = useRef(null);

  // Configuración de API URL para desarrollo local y producción
  const API_URL =
    process.env.NODE_ENV === 'production'
      ? '/api/chat'
      : 'http://localhost:5000/api/chat';

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

    // Inicializar reconocimiento de voz
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'es-ES';
      
      recognitionInstance.onstart = () => {
        setIsListening(true);
      };
      
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
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
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
      body: JSON.stringify({ 
        message: input,
        sessionId: sessionId
      }),
    });

    // ✅ NUEVO: Verifica el status antes de parsear
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error del servidor:', errorText);
      throw new Error(`Error ${response.status}: El servidor tuvo un problema`);
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



  const startChat = () => {
    setShowSplash(false);
  };

  const toggleVoiceRecognition = () => {
    if (!recognition) {
      alert('Tu navegador no soporta reconocimiento de voz. Prueba con Chrome o Edge.');
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  // Splash Screen Component
  if (showSplash) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-green-700">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/8 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        
        {/* Floating particles */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/60 rounded-full animate-ping"></div>
          <div className="absolute top-3/4 left-3/4 w-1 h-1 bg-green-300/80 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute top-1/2 left-1/6 w-1.5 h-1.5 bg-white/70 rounded-full animate-ping" style={{animationDelay: '1.5s'}}></div>
          <div className="absolute top-1/6 right-1/4 w-1 h-1 bg-blue-400/60 rounded-full animate-ping" style={{animationDelay: '2.5s'}}></div>
        </div>
        
        <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
          <div className="text-center max-w-md mx-auto">
            {/* Logo/Robot container */}
            <div className="relative mb-12">
              {/* Outer glow ring */}
              <div className="absolute inset-0 w-40 h-40 mx-auto rounded-full bg-green-600 opacity-25 animate-spin" style={{animationDuration: '8s'}}></div>
              
              {/* Robot container */}
              <div className="relative w-32 h-32 mx-auto">
                <div className="w-full h-full rounded-full bg-white shadow-2xl border-4 border-green-500/50 flex items-center justify-center backdrop-blur-lg">
                  <Bot className="w-16 h-16 text-green-700 drop-shadow-lg animate-bounce" />
                </div>
                
                {/* Status indicators */}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-4 border-white shadow-lg animate-pulse flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
                
                {/* Floating mini elements */}
                <div className="absolute -top-6 -left-4 w-4 h-4 bg-green-400 rounded-full animate-bounce opacity-80" style={{animationDelay: '0.5s'}}></div>
                <div className="absolute -bottom-4 -right-6 w-3 h-3 bg-white rounded-full animate-bounce opacity-70" style={{animationDelay: '1s'}}></div>
              </div>
            </div>
            
            {/* Title with gradient text */}
            <div className="mb-6">
              <h1 className="text-5xl md:text-6xl font-black text-white mb-3 drop-shadow-2xl">
                Asistente USS
              </h1>
              <div className="w-24 h-1 bg-white mx-auto rounded-full"></div>
            </div>
            
            {/* Subtitle */}
            <p className="text-green-100 text-xl font-light mb-12 leading-relaxed">
              Tu asistente inteligente del
              <br />
              <span className="font-semibold text-white">
                Centro de Informática USS
              </span>
            </p>
            
            {/* Interactive start button */}
            <button 
              onClick={startChat}
              className="group relative bg-white hover:bg-green-50 text-green-700 font-bold text-lg px-10 py-5 rounded-2xl shadow-2xl hover:shadow-white/25 transition-all duration-300 hover:scale-110 active:scale-95 transform"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Mic className="w-6 h-6 group-hover:animate-pulse" />
                  <div className="absolute inset-0 bg-white/20 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <span>Comenzar Chat</span>
              </div>
              
              {/* Button glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </button>
            
            {/* Feature hints */}
            <div className="mt-8 flex justify-center space-x-6 text-blue-100 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span>Reconocimiento de voz</span>
              </div>              
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
        : 'bg-gradient-to-br from-green-700 via-green-600 to-green-800'
    }`}>
      {/* Elementos animados de fondo similar al splash */}
      {!darkMode && (
        <>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-10 w-32 h-32 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-48 h-48 bg-green-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-white/3 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          </div>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 right-1/4 w-1 h-1 bg-white/40 rounded-full animate-ping"></div>
            <div className="absolute bottom-1/3 left-1/4 w-0.5 h-0.5 bg-green-300/60 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
            <div className="absolute top-2/3 right-1/6 w-1 h-1 bg-white/50 rounded-full animate-ping" style={{animationDelay: '1.5s'}}></div>
          </div>
        </>
      )}
      
      {/* Contenedor del chat con fondo blanco */}
      <div className={`flex flex-col h-screen max-w-4xl mx-auto relative z-10 ${
        darkMode 
          ? 'bg-gray-800 shadow-2xl' 
          : 'bg-white shadow-2xl'
      } md:my-4 md:rounded-2xl md:h-[calc(100vh-2rem)] overflow-hidden`}>
      {/* Header */}
      <div className={`shadow-sm border-b p-4 transition-colors duration-300 ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        {/* Mobile status bar - Solo botón de tema */}
        <div className="flex md:hidden items-center justify-end mb-4">
          <button className="p-2" onClick={toggleDarkMode}>
            {darkMode ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
        
        {/* Chat Header */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-green-700 flex items-center justify-center shadow-lg">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
          </div>
          <div className="flex-1">
            <h1 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Centro de Informática USS</h1>
            <p className="text-sm text-green-500 font-medium">En línea</p>
          </div>
          <div className="flex items-center gap-2">
            <button className={`p-2 rounded-full transition-colors duration-200 hidden md:block ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`} onClick={toggleDarkMode}>
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
            </button>
          </div>
        </div>
      </div>

      {/* Voice Recording Indicator */}
      {isListening && (
        <div className="bg-red-500 text-white px-4 py-2 text-center text-sm font-medium animate-pulse">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
            Escuchando... Habla ahora
            <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className={`chat-messages flex-1 overflow-y-auto p-4 space-y-4 md:p-6 transition-colors duration-300 ${
        darkMode 
          ? 'bg-gray-800' 
          : 'bg-gray-50'
      }`}>
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            {/* Bot messages */}
            {message.type === 'bot' && (
              <div className="flex items-start gap-3 max-w-[85%] md:max-w-[70%] group">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-green-700 flex items-center justify-center shadow-lg flex-shrink-0 group-hover:shadow-green-600/40 group-hover:scale-105 transition-all duration-300">
                  <Bot className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div className={`rounded-2xl rounded-tl-md p-4 md:p-5 backdrop-blur-sm border-2 group-hover:shadow-xl group-hover:scale-[1.02] transition-all duration-300 ${
                  darkMode 
                    ? 'bg-gradient-to-br from-gray-800/95 to-gray-700/90 border-green-400/40 text-gray-100 shadow-lg shadow-green-400/25' 
                    : 'bg-gradient-to-br from-green-50/90 to-white/95 border-green-400/60 text-gray-800 shadow-lg shadow-green-600/20'
                } relative overflow-hidden`}>
                  <div className={`absolute inset-0 bg-gradient-to-r ${
                    darkMode 
                      ? 'from-green-500/5 to-transparent' 
                      : 'from-green-100/50 to-transparent'
                  } pointer-events-none`}></div>
                  <div className="relative z-10">
                    <div 
                      className={`text-sm md:text-base leading-relaxed ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}
                      dangerouslySetInnerHTML={{ __html: formatMessage(message.text) }}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* User messages */}
            {message.type === 'user' && (
              <div className="flex items-start gap-3 max-w-[85%] md:max-w-[70%] flex-row-reverse group">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-green-700 flex items-center justify-center shadow-lg flex-shrink-0 group-hover:shadow-green-600/40 group-hover:scale-105 transition-all duration-300">
                  <User className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div className="bg-green-700 rounded-2xl rounded-tr-md p-4 md:p-5 shadow-lg shadow-green-700/25 backdrop-blur-sm group-hover:shadow-xl group-hover:shadow-green-700/40 group-hover:scale-[1.02] transition-all duration-300 border border-green-600/50">
                  <div className="text-white text-sm md:text-base leading-relaxed">
                    {message.text}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start gap-3 max-w-[80%] group">
              <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center shadow-lg animate-pulse">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className={`rounded-2xl rounded-tl-md p-4 md:p-5 backdrop-blur-sm border-2 shadow-lg transition-all duration-300 ${
                darkMode 
                  ? 'bg-gray-800/90 border-green-400/30 shadow-green-400/20' 
                  : 'bg-white/95 border-green-300/50 shadow-green-600/15'
              }`}>
                <div className="flex gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full animate-bounce transition-colors duration-300 ${darkMode ? 'bg-green-400' : 'bg-green-600'}`} style={{animationDelay: '0ms'}}></div>
                  <div className={`w-2.5 h-2.5 rounded-full animate-bounce transition-colors duration-300 ${darkMode ? 'bg-green-400' : 'bg-green-600'}`} style={{animationDelay: '150ms'}}></div>
                  <div className={`w-2.5 h-2.5 rounded-full animate-bounce transition-colors duration-300 ${darkMode ? 'bg-green-400' : 'bg-green-600'}`} style={{animationDelay: '300ms'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
        </div>

      {/* Input Area */}
      <div className={`border-t p-4 md:p-6 transition-colors duration-300 ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          <div className="flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              rows={1}
              placeholder={isListening ? "🎤 Escuchando... Habla ahora" : "Escribe aquí tu consulta"}
              className={`w-full rounded-2xl px-4 py-3 md:py-4 md:px-6 focus:outline-none focus:ring-2 focus:ring-green-300 transition-all duration-200 text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed resize-none ${
                darkMode 
                  ? 'bg-gray-700 text-white placeholder-gray-400 focus:bg-gray-600 border border-gray-600 focus:border-green-400' 
                  : 'bg-white text-gray-900 placeholder-gray-500 focus:bg-white border-2 border-green-200 focus:border-green-400 shadow-sm'
              }`}
              style={{
                minHeight: '48px',
                maxHeight: '120px',
                overflowY: 'hidden'
              }}
              onInput={(e) => {
                // Auto-resize textarea
                e.target.style.height = 'auto';
                const newHeight = Math.min(e.target.scrollHeight, 120);
                e.target.style.height = newHeight + 'px';
                
                // Solo mostrar scroll si el contenido excede el máximo
                if (e.target.scrollHeight > 120) {
                  e.target.style.overflowY = 'auto';
                } else {
                  e.target.style.overflowY = 'hidden';
                }
              }}
            />
          </div>
          
          {input.trim() && (
            <button
              onClick={handleSend}
              disabled={isLoading}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white p-2 rounded-full hover:shadow-lg transition-all duration-200 disabled:opacity-50 hover:scale-105 active:scale-95 flex-shrink-0"
            >
              <Send className="w-6 h-6" />
            </button>
          )}
          
          <button 
            onClick={toggleVoiceRecognition}
            className={`p-2 rounded-full transition-all duration-200 ${
              isListening
                ? 'bg-green-700 text-white animate-pulse shadow-lg shadow-green-600/25'
                : darkMode 
                  ? 'text-green-400 hover:bg-green-700' 
                  : 'text-green-700 hover:bg-green-50'
            }`}
            title={isListening ? 'Detener grabación' : 'Iniciar grabación de voz'}
          >
            <Mic className={`w-6 h-6 ${isListening ? 'animate-pulse' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  </div>
  );
}

export default App;
