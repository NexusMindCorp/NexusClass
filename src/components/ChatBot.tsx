import { useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, Sparkles } from 'lucide-react';
import { useChatBox } from '../hooks/useChatBox';

export function ChatBot(){
  const { isOpen, setIsOpen, input, setInput, handleSend, messages, loading } = useChatBox();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      {/* Janela de Chat */}
      {isOpen && (
        <div className="w-[350px] h-[500px] max-h-[calc(100vh-7rem)] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] mb-4 flex flex-col border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          
          {/* Header Customizado */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Bot size={20} />
              </div>
              <div>
                <p className="text-sm font-bold leading-none">Tigreso</p>
                <p className="text-[10px] text-blue-100 mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Online Agora
                </p>
              </div>
            </div>
          </div>

          {/* Área de Mensagens */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 space-y-4 bg-slate-50">
            {messages.length === 0 && (
              <div className="text-center mt-10">
                <Sparkles className="mx-auto text-indigo-300 mb-2" size={32} />
                <p className="text-gray-400 text-xs">Como posso te ajudar hoje?</p>
              </div>
            )}
            
            {messages.map((msg, idx) => {
              const respostaLonga = msg.role === 'model' && msg.text.length > 220;

              return (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`w-fit p-3 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
                    msg.role === 'user'
                      ? 'max-w-[82%] bg-indigo-600 text-white rounded-br-none'
                      : `${respostaLonga ? 'max-w-[95%]' : 'max-w-[78%]'} bg-white text-gray-700 border border-gray-200 rounded-bl-none`
                  }`}>
                    {msg.text}
                  </div>
                </div>
              );
            })}
            
            {loading && (
              <div className="flex items-center gap-1 bg-gray-200 w-12 h-6 justify-center rounded-full animate-pulse">
                <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" />
                <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Campo de Input */}
          <div className="p-4 bg-gray border-t border-gray-100">
            <div className="relative flex items-center">
              <input 
                className="w-full placeholder:text-gray-400 text-gray-900 bg-gray-100 border-none outline-none focus:ring-2 focus:ring-indigo-500/30 p-3 pr-12 rounded-xl transition-all"
                placeholder="Pergunte qualquer coisa..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button 
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="absolute right-2 p-2 text-indigo-600 hover:text-indigo-800 disabled:text-gray-300 transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botão de Abrir/Fechar */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${
          isOpen ? 'bg-gray-900 rotate-180' : 'bg-indigo-600'
        }`}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={28} />}
      </button>
    </div>
  );
};