import { useState } from 'react';
import { useGeminiChat } from './useChatBot';
import type { UsuarioProps } from './useGerenciador';
export function useChatBox(usuario:UsuarioProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, loading, sendMessage } = useGeminiChat( usuario);
   const handleSend = () => {
    if (input.trim()) {
      sendMessage(input);
      setInput('');
    }
  };

  return { isOpen, setIsOpen, input, setInput, handleSend, messages, loading };
}