import { useState, useCallback } from 'react';
import { useGeminiChat } from './useChatBot';
import type { UsuarioProps } from './useGerenciador';
export function useChatBox(usuario:UsuarioProps & { pedirAjuda: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHelpMode, setIsHelpMode] = useState(false);
  const [input, setInput] = useState('');
  const { messages, loading, sendMessage } = useGeminiChat(usuario, isHelpMode);
  
  // Fechar chat e retomar instrução principal
  const closeChat = useCallback(() => {
    setIsOpen(false);
    setIsHelpMode(false);
  }, []);
    
  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input);
      setInput('');
    }
  };

  return { isOpen, setIsOpen, closeChat, isHelpMode, setIsHelpMode, input, setInput, handleSend, messages, loading };
}