import { useState } from 'react';
import { useGeminiChat } from './useChatBot';
export function useChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, loading, sendMessage } = useGeminiChat();
   const handleSend = () => {
    if (input.trim()) {
      sendMessage(input);
      setInput('');
    }
  };

  return { isOpen, setIsOpen, input, setInput, handleSend, messages, loading };
}