export interface ChatMessage {
    id: string;
    content: string;
    role: 'user' | 'assistant' | 'system';
    timestamp: Date;
    isLoading?: boolean;
    error?: boolean;
    metadata?: {
      type?: 'symptom' | 'medicine' | 'first_aid' | 'general';
      confidence?: number;
      suggestedActions?: string[];
    };
  }
  
  export interface QuickAction {
    id: string;
    title: string;
    description: string;
    icon: string;
    prompt: string;
    color: 'blue' | 'green' | 'purple' | 'orange';
  }
  
  export interface ChatSession {
    id: string;
    title: string;
    createdAt: Date;
    messages: ChatMessage[];
    tags: string[];
  }