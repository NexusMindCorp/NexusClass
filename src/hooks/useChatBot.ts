import { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI, ChatSession } from "@google/generative-ai";


const API_KEY = import.meta.env.VITE_GEMINI_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export interface Message {
  role: 'user' | 'model';
  text: string;
}

export const useGeminiChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<ChatSession | null>(null);

  useEffect(() => {
    const initChat = async () => {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-3-flash-preview",
        systemInstruction: "Você é o 'Tigreso', um assistente virtual para alunos. Seja conciso, amigável e responda em português sem emoji. " +
                           "Responda sobre matérias, horários, professores e dúvidas comuns. Se não souber, peça para contatar suporte."
      });

      chatRef.current = model.startChat({
        history: [],
        generationConfig: {
          maxOutputTokens: 250,
          temperature: 0.7,
        },
      });
    };

    initChat();
  }, []);

  const sendMessage = async (input: string) => {
    if (!input.trim() || !chatRef.current) return;

    const userMsg: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    const MAX_RETRIES = 2;
    const DELAY_BASE = 500; // 500ms início mais rápido

    // Função recursiva para tentar enviar a mensagem com retry
    const sendWithRetry = async (attempt = 0): Promise<string> => {
      try {
        const result = await chatRef.current!.sendMessage(input);
        const response = await result.response;
        return response.text();
      } catch (error: any) {
        const status = error?.status || error?.message;
        const isServiceUnavailable = status === 503 || error?.message?.includes("503") || 
                                    error?.message?.includes("high demand");

        // Se o serviço está indisponível e ainda temos tentativas, aguarda e tenta novamente
        if (isServiceUnavailable && attempt < MAX_RETRIES) {
          const delay = DELAY_BASE * Math.pow(2, attempt); // Backoff exponencial
          console.log(`Tentando de novo em ${delay}ms... (${attempt + 1}/${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return sendWithRetry(attempt + 1);
        }

        throw error;
      }
    };

    try {
      const botText = await sendWithRetry();
      const botMsg: Message = { role: 'model', text: botText };
      setMessages(prev => [...prev, botMsg]);
    } catch (error: any) {
      console.error("Erro no Gemini:", error);
      const errorMessage = error?.message?.includes("503") 
        ? "O serviço está sobrecarregado no momento. Por favor, tente novamente em alguns minutos."
        : "Desculpe, tive um erro técnico. Pode tentar novamente?";
      
      setMessages(prev => [...prev, { role: 'model', text: errorMessage }]);
    } finally {
      setLoading(false);
    }
  };

  return { messages, loading, sendMessage };
};