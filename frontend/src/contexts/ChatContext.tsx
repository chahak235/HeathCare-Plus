import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ollamaService } from '../services/ollama-service';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isLoading?: boolean;
  error?: boolean;
}

interface ChatContextType {
  messages: ChatMessage[];
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  isLoading: boolean;
  isOllamaAvailable: boolean;
  chatHistory: string[];
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: 'Hello! I am Healthcare+ AI Assistant. I can help with symptoms, medicines, first aid, and general health questions. How can I assist you today?',
      role: 'assistant',
      timestamp: new Date(),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOllamaAvailable, setIsOllamaAvailable] = useState(false);
  const [chatHistory, setChatHistory] = useState<string[]>([]);

  useEffect(() => {
    const checkOllama = async () => {
      const available = await ollamaService.checkAvailability();
      setIsOllamaAvailable(available);
    };
    checkOllama();

    // Load chat history
    const savedHistory = localStorage.getItem('healthcare_chat_history');
    if (savedHistory) {
      setChatHistory(JSON.parse(savedHistory));
    }
  }, []);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: content.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Update history
    const newHistory = [content.trim(), ...chatHistory.slice(0, 9)];
    setChatHistory(newHistory);
    localStorage.setItem('healthcare_chat_history', JSON.stringify(newHistory));

    // Add loading message
    const loadingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      isLoading: true,
    };
    
    setMessages(prev => [...prev, loadingMessage]);
    setIsLoading(true);

    try {
      const aiResponse = await ollamaService.generate(userMessage.content, true);
      
      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessage.id 
          ? {
              ...msg,
              content: aiResponse,
              isLoading: false,
              timestamp: new Date(),
            }
          : msg
      ));
    } catch (error) {
      console.error('Error generating response:', error);
      
      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessage.id 
          ? {
              ...msg,
              content: 'Sorry, I encountered an error. Please try again in a moment.',
              isLoading: false,
              error: true,
            }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([
      {
        id: '1',
        content: 'Hello! I am Healthcare+ AI Assistant. How can I assist you today?',
        role: 'assistant',
        timestamp: new Date(),
      }
    ]);
  };

  return (
    <ChatContext.Provider value={{
      messages,
      sendMessage,
      clearMessages,
      isLoading,
      isOllamaAvailable,
      chatHistory
    }}>
      {children}
    </ChatContext.Provider>
  );
};