import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Moon, Sun } from 'lucide-react';

function App() {
  const [messages, setMessages] = useState([
    { type: 'bot', text: '¡Hola! 👋 Soy tu asistente del Centro de Informática USS.\n\n¿En qué puedo ayudarte hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const messagesEndRef = useRef(null);

  const API_URL = process.env.NODE_ENV === 'production' 
    ? '/api/chat' 
    : 'http://localhost:5000/api/chat';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cargar preferencia de tema
  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme === 'true') {
      setDarkMode(true);
    }
  }, []);

  // Guardar preferencia de tema
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
  };

  // Función para formatear el texto con markdown
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

  return (
    <div className={`flex flex-col h-screen max-w-4xl mx-auto ${
      darkMode ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-blue-50 to-indigo-50'
    }`}>
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
          
          {/* Botón de tema */}
          <button
            onClick={toggleDarkMode}
            className={`p-3 rounded-full transition-all duration-300 ${
              darkMode
                ? 'bg-gray-600 hover:bg-gray-500 text-yellow-300'
                : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
            title={darkMode ? 'Modo claro' : 'Modo oscuro'}
          >
            {darkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message, index) => (
          <div key={index}>
            <div
              className={`flex items-start gap-3 ${
                message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  message.type === 'user'
                    ? darkMode 
                      ? 'bg-blue-600 text-white'
                      : 'bg-indigo-600 text-white'
                    : darkMode
                      ? 'bg-gray-700 text-blue-400 shadow-lg'
                      : 'bg-white text-blue-600 shadow-md'
                }`}
              >
                {message.type === 'user' ? (
                  <User className="w-5 h-5" />
                ) : (
                  <Bot className="w-5 h-5" />
                )}
              </div>
              <div
                className={`max-w-2xl p-4 rounded-2xl shadow-sm transition-colors duration-300 ${
                  message.type === 'user'
                    ? darkMode
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-indigo-600 text-white rounded-tr-none'
                    : darkMode
                      ? 'bg-gray-700 text-gray-100 rounded-tl-none shadow-lg'
                      : 'bg-gradient-to-br from-blue-50 to-indigo-50 text-gray-800 rounded-tl-none border-2 border-blue-200 shadow-md'
                }`}
              >
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
              darkMode
                ? 'bg-gray-700 text-blue-400 shadow-lg'
                : 'bg-white text-blue-600 shadow-md'
            }`}>
              <Bot className="w-5 h-5" />
            </div>
            <div className={`p-4 rounded-2xl rounded-tl-none shadow-sm ${
              darkMode ? 'bg-gray-700' : 'bg-white'
            }`}>
              <div className="flex gap-2">
                <div className={`w-2 h-2 rounded-full animate-bounce ${
                  darkMode ? 'bg-blue-400' : 'bg-blue-600'
                }`} style={{animationDelay: '0ms'}}></div>
                <div className={`w-2 h-2 rounded-full animate-bounce ${
                  darkMode ? 'bg-blue-400' : 'bg-blue-600'
                }`} style={{animationDelay: '150ms'}}></div>
                <div className={`w-2 h-2 rounded-full animate-bounce ${
                  darkMode ? 'bg-blue-400' : 'bg-blue-600'
                }`} style={{animationDelay: '300ms'}}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={`border-t p-4 shadow-lg transition-colors duration-300 ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
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
  );
}

export default App;
