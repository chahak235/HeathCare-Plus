import { ChatMessage } from '../types/medical.types';

export const mockChatMessages: ChatMessage[] = [
  {
    id: '1',
    content: 'Hello! I\'m your AI Healthcare Assistant. How can I help you today?',
    sender: 'assistant',
    timestamp: new Date('2024-01-15T09:00:00'),
    type: 'text'
  },
  {
    id: '2',
    content: 'I have a persistent cough for 2 weeks. What should I do?',
    sender: 'user',
    timestamp: new Date('2024-01-15T09:01:00'),
    type: 'text'
  },
  {
    id: '3',
    content: 'A persistent cough lasting more than 3 weeks should be evaluated by a healthcare professional. Common causes include respiratory infections, allergies, or asthma. Do you have any other symptoms like fever, shortness of breath, or chest pain?',
    sender: 'assistant',
    timestamp: new Date('2024-01-15T09:01:30'),
    type: 'text'
  },
  {
    id: '4',
    content: '⚠️ IMPORTANT: I am an AI assistant and cannot provide medical diagnoses. Please consult with a qualified healthcare professional for proper evaluation and treatment.',
    sender: 'system',
    timestamp: new Date('2024-01-15T09:01:35'),
    type: 'text',
    isEmergency: true
  }
];