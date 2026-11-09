import React, { useState, useRef, useEffect } from 'react';
import { Container } from '../components/layout/Container';
import { GlassCard } from '../components/layout/GlassCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { MedicalDisclaimer } from '../components/shared/MedicalDisclaimer';
import {
    Send,
    Mic,
    MicOff,
    Upload as UploadIcon,
    Paperclip,
    Smile,
    Bot,
    User,
    AlertTriangle,
    Clock,
    Shield,
    ThumbsUp,
    ThumbsDown,
    Copy,
    MoreVertical
} from 'lucide-react';
import { mockChatMessages } from '../mocks/chatMessages';

export const ChatAssistant: React.FC = () => {
    const [messages, setMessages] = useState(mockChatMessages);
    const [inputValue, setInputValue] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = () => {
        if (!inputValue.trim()) return;

        const newMessage = {
            id: Date.now().toString(),
            content: inputValue,
            sender: 'user' as const,
            timestamp: new Date(),
            type: 'text' as const
        };

        setMessages(prev => [...prev, newMessage]);
        setInputValue('');
        setIsLoading(true);

        // Simulate AI response
        setTimeout(() => {
            const aiResponse = {
                id: (Date.now() + 1).toString(),
                content: 'I understand your concern. Based on your description, I recommend consulting with a healthcare professional for proper evaluation. Remember, I am an AI assistant and cannot provide medical diagnoses.',
                sender: 'assistant' as const,
                timestamp: new Date(),
                type: 'text' as const
            };
            setMessages(prev => [...prev, aiResponse]);
            setIsLoading(false);
        }, 1500);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const toggleRecording = () => {
        setIsRecording(!isRecording);
        // In a real app, this would start/stop voice recording
    };

    return (
        <div className="min-h-screen py-8">
            <Container>
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
                                AI Healthcare Assistant
                            </h1>
                            <p className="text-lg text-neutral-600 dark:text-neutral-400">
                                24/7 medical guidance and symptom checking
                            </p>
                        </div>
                        <Badge variant="success">
                            <Shield className="w-3 h-3 mr-1" />
                            HIPAA Compliant
                        </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Chat Interface */}
                    <div className="lg:col-span-3">
                        <GlassCard className="h-[600px] flex flex-col">
                            {/* Chat Header */}
                            <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
                                <div className="flex items-center">
                                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mr-3">
                                        <Bot className="w-6 h-6 text-primary-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-neutral-900 dark:text-white">
                                            HealthCare+ Assistant
                                        </h3>
                                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                            Always online • Medical guidance only
                                        </p>
                                    </div>
                                    <div className="ml-auto flex items-center space-x-2">
                                        <Clock className="w-4 h-4 text-neutral-400" />
                                        <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                            2.4s avg response
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Messages Container */}
                            <div className="flex-1 overflow-y-auto p-4">
                                <MedicalDisclaimer className="mb-4" />

                                <div className="space-y-4">
                                    {messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[80%] rounded-2xl p-4 ${message.sender === 'user'
                                                    ? 'bg-primary-600 text-white rounded-br-none'
                                                    : message.sender === 'system'
                                                        ? 'bg-error-50 border border-error-200 dark:bg-error-900/20 dark:border-error-800'
                                                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-bl-none'
                                                    }`}
                                            >
                                                {message.sender === 'system' && message.isEmergency && (
                                                    <div className="flex items-center mb-2">
                                                        <AlertTriangle className="w-4 h-4 text-error-600 mr-2" />
                                                        <span className="font-bold text-error-700 dark:text-error-400">
                                                            Important Notice
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="flex items-start">
                                                    {message.sender === 'assistant' && (
                                                        <Bot className="w-5 h-5 mr-2 mt-0.5 text-primary-600 flex-shrink-0" />
                                                    )}
                                                    {message.sender === 'user' && (
                                                        <User className="w-5 h-5 mr-2 mt-0.5 text-white/80 flex-shrink-0" />
                                                    )}
                                                    <div>
                                                        <p className={message.sender === 'system' ? 'text-error-700 dark:text-error-400' : ''}>
                                                            {message.content}
                                                        </p>
                                                        <div className="flex items-center justify-between mt-2">
                                                            <span className="text-xs opacity-70">
                                                                {message.timestamp.toLocaleTimeString([], {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </span>
                                                            {message.sender === 'assistant' && (
                                                                <div className="flex items-center space-x-1">
                                                                    <button className="p-1 hover:bg-white/10 rounded">
                                                                        <ThumbsUp className="w-3 h-3" />
                                                                    </button>
                                                                    <button className="p-1 hover:bg-white/10 rounded">
                                                                        <ThumbsDown className="w-3 h-3" />
                                                                    </button>
                                                                    <button className="p-1 hover:bg-white/10 rounded">
                                                                        <Copy className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {isLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl rounded-bl-none p-4 max-w-[80%]">
                                                <div className="flex items-center">
                                                    <Bot className="w-5 h-5 mr-2 text-primary-600" />
                                                    <div className="flex space-x-1">
                                                        <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" />
                                                        <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                                        <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div ref={messagesEndRef} />
                                </div>
                            </div>

                            {/* Input Area */}
                            <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
                                <div className="flex items-end space-x-2">
                                    <div className="flex-1">
                                        <Input
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            onKeyDown={handleKeyPress}
                                            placeholder="Describe your symptoms or ask a medical question..."
                                            className="w-full"
                                            multiline
                                            rows={2}
                                        />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="p-2"
                                            onClick={() => {/* Attach file */ }}
                                        >
                                            <Paperclip className="w-5 h-5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={`p-2 ${isRecording ? 'text-error-600' : ''}`}
                                            onClick={toggleRecording}
                                        >
                                            {isRecording ? (
                                                <MicOff className="w-5 h-5" />
                                            ) : (
                                                <Mic className="w-5 h-5" />
                                            )}
                                        </Button>
                                        <Button
                                            onClick={handleSendMessage}
                                            disabled={!inputValue.trim() || isLoading}
                                            className="p-2"
                                        >
                                            {isLoading ? (
                                                <LoadingSpinner size="sm" />
                                            ) : (
                                                <Send className="w-5 h-5" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center space-x-2 text-sm text-neutral-600 dark:text-neutral-400">
                                        <button className="flex items-center hover:text-primary-600">
                                            <Smile className="w-4 h-4 mr-1" />
                                            Quick Responses
                                        </button>
                                        <span>•</span>
                                        <button className="flex items-center hover:text-primary-600">
                                            <UploadIcon className="w-4 h-4 mr-1" />
                                            Upload Image
                                        </button>
                                    </div>
                                    <div className="text-xs text-neutral-500">
                                        Press Enter to send, Shift+Enter for new line
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    </div>

                    {/* Side Panel */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <GlassCard className="p-6">
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
                                Quick Actions
                            </h3>
                            <div className="space-y-3">
                                <Button
                                    variant="secondary"
                                    fullWidth
                                    className="justify-start"
                                    onClick={() => setInputValue("I have a fever and cough for 3 days")}
                                >
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    Fever & Cough
                                </Button>
                                <Button
                                    variant="secondary"
                                    fullWidth
                                    className="justify-start"
                                    onClick={() => setInputValue("What are the symptoms of COVID-19?")}
                                >
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    COVID-19 Info
                                </Button>
                                <Button
                                    variant="secondary"
                                    fullWidth
                                    className="justify-start"
                                    onClick={() => setInputValue("I have chest pain and shortness of breath")}
                                >
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    Chest Pain
                                </Button>
                                <Button
                                    variant="secondary"
                                    fullWidth
                                    className="justify-start"
                                    onClick={() => setInputValue("Where can I find a doctor near me?")}
                                >
                                    <User className="w-4 h-4 mr-2" />
                                    Find a Doctor
                                </Button>
                            </div>
                        </GlassCard>

                        {/* Emergency Info */}
                        <GlassCard className="p-6 bg-gradient-to-b from-error-50 to-white dark:from-error-900/10 dark:to-neutral-800">
                            <div className="text-center">
                                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-error-100 dark:bg-error-900/30 flex items-center justify-center">
                                    <AlertTriangle className="w-6 h-6 text-error-600" />
                                </div>
                                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
                                    Medical Emergency?
                                </h3>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                                    If you're experiencing a medical emergency:
                                </p>
                                <div className="space-y-2">
                                    <Button variant="danger" fullWidth>
                                        Call 911 (US)
                                    </Button>
                                    <Button variant="danger" fullWidth>
                                        Emergency Services
                                    </Button>
                                </div>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-4">
                                    This AI assistant cannot handle emergencies
                                </p>
                            </div>
                        </GlassCard>

                        {/* Chat History */}
                        <GlassCard className="p-6">
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
                                Recent Conversations
                            </h3>
                            <div className="space-y-3">
                                <div className="p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-neutral-900 dark:text-white">
                                            Chest Pain Inquiry
                                        </span>
                                        <span className="text-xs text-neutral-500">Today</span>
                                    </div>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
                                        Asked about chest pain symptoms and...
                                    </p>
                                </div>
                                <div className="p-3 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-neutral-900 dark:text-white">
                                            COVID-19 Symptoms
                                        </span>
                                        <span className="text-xs text-neutral-500">Yesterday</span>
                                    </div>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
                                        Discussed COVID-19 testing and prevention...
                                    </p>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </Container>
        </div>
    );
};