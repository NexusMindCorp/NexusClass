import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Send, X, Bot, Sparkles } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { useChatBox } from '../hooks/botsHooks/useChatBox';
import type { UsuarioProps } from '@/hooks/useGerenciador';
import type { PerfilUsuario } from '@/hooks/useAuth';
import { getAssetPath } from '@/lib/assetPath';

const perfilBot = getAssetPath('perfilBot/perfilBot.jpg');

type ChatBotProps = {
  usuario: UsuarioProps
  listaEscolar: any;
}

export const ChatBot = forwardRef(function ChatBot({ usuario, listaEscolar }: ChatBotProps, ref) {
  const { perfil, materiasProfessor } = useOutletContext<{ session: unknown; perfil: PerfilUsuario | null; materiasProfessor: string[] }>()
  // Log for debugging end-to-end subject passing
  const { isOpen, setIsOpen, closeChat, setIsHelpMode, input, setInput, handleSend, messages, loading } = useChatBox(usuario, perfil, materiasProfessor, listaEscolar);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Expor função de abrir com modo ajuda
  useImperativeHandle(ref, () => ({
    abrirComAjuda: () => {
      setIsHelpMode(true);
      setIsOpen(true);
    }
  }), [setIsHelpMode, setIsOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">

      {/* Janela de Chat */}
      {isOpen && (
        <div className="w-[350px] h-[480px] max-h-[calc(100vh-6rem)] bg-card text-card-foreground rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex flex-col border border-border overflow-hidden animate-in slide-in-from-bottom-5 duration-300">

          {/* Lugar Sagrado do Tigreso */}
          <div
            className="p-4 text-primary-foreground flex justify-between items-center"
            style={{ backgroundImage: 'linear-gradient(135deg, #7C3AED 0%, #DB2777 100%)' }}
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                {perfilBot ? <img src={perfilBot} alt="Perfil do Bot" className="w-10 h-10 rounded-full" /> : <Bot size={20} />}
              </div>
              <div>
                <p className="text-sm font-bold leading-none">Tigreso</p>
                <p className="text-[10px] text-primary-foreground/80 mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Online Agora
                </p>
              </div>
            </div>

            {/* Botão de fechar */}
            <button
              onClick={closeChat}
              className="p-4 -mr-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-foreground"
              title="Fechar chat"
            >
              <X size={20} />
            </button>
          </div>

          {/* Área de Mensagens */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 space-y-4 bg-background">
            {messages.length === 0 && (
              <div className="text-center mt-10">
                <Sparkles className="mx-auto text-primary/50 mb-2" size={32} />
                <p className="text-muted-foreground text-xs">Como posso te ajudar hoje?</p>
              </div>
            )}

            {messages.map((msg, idx) => {
              const respostaLonga = msg.role === 'model' && msg.text.length > 220;

              return (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`w-fit p-3 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap break-words shadow-sm ${msg.role === 'user'
                      ? 'text-white rounded-br-none'
                      : `${respostaLonga ? 'max-w-[95%]' : 'max-w-[78%]'} bg-muted text-foreground border border-border rounded-bl-none`
                      }`}
                    style={msg.role === 'user' ? { backgroundImage: 'linear-gradient(135deg, #7C3AED 0%, #DB2777 100%)' } : undefined}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-1 bg-muted w-12 h-6 justify-center rounded-full animate-pulse border border-border">
                <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" />
                <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            )}

            <div ref={scrollRef} />
          </div>

          {/* Campo de Input */}
          <div className="p-4 bg-card border-t border-border">
            <div className="relative flex items-center">
              <input
                className="w-full placeholder:text-muted-foreground text-foreground bg-muted border border-transparent outline-none focus:ring-2 focus:ring-ring focus:border-ring p-3 pr-12 rounded-xl transition-all"
                placeholder="Pergunte qualquer coisa..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="absolute right-2 p-2 cursor-pointer text-primary opacity-80 disabled:cursor-not-allowed disabled:text-muted-foreground transition-all"
                type="button"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botão de Abrir */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full flex cursor-pointer items-center justify-center shadow-lg hover:shadow-[0_0_20px_rgba(139,92,246,0.6)] hover:scale-105 hover:brightness-105 active:scale-95 transition-all duration-300 text-white"
          style={{ backgroundImage: 'linear-gradient(135deg, #7C3AED 0%, #DB2777 100%)' }}
        >
          <Bot size={28} />
        </button>
      )}
    </div>
  );
});