import React, { useState, useEffect, useRef } from 'react';
import { Container } from '../components/layout/Container';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ChatMessageBubble } from '../components/chat/ChatMessageBubble';
import { QuickActions } from '../components/chat/QuickActions';
import { ollamaService } from '../services/ollama-service';
import {
    Send,
    Bot,
    Sparkles,
    Shield,
    Download,
    Trash2,
    History,
    Volume2,
    Mic,
    FileText,
    Clock,
    CheckCircle,
    AlertTriangle
} from 'lucide-react';

interface ChatMessage {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
    isLoading?: boolean;
    error?: boolean;
}

export const Chat: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            content: 'Hello! I am Healthcare+ AI Assistant. I can help with symptoms, medicines, first aid, and general health questions. How can I assist you today?',
            role: 'assistant',
            timestamp: new Date(),
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isOllamaAvailable, setIsOllamaAvailable] = useState(false);
    const [showDisclaimer, setShowDisclaimer] = useState(true);
    const [chatHistory, setChatHistory] = useState<string[]>([]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Check Ollama availability on mount
    useEffect(() => {
        const checkOllama = async () => {
            const available = await ollamaService.checkAvailability();
            setIsOllamaAvailable(available);
        };
        checkOllama();

        // Load chat history from localStorage
        const savedHistory = localStorage.getItem('healthcare_chat_history');
        if (savedHistory) {
            setChatHistory(JSON.parse(savedHistory));
        }
    }, []);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            content: inputMessage.trim(),
            role: 'user',
            timestamp: new Date(),
        };

        // Add user message
        setMessages(prev => [...prev, userMessage]);

        // Save to history
        const newHistory = [inputMessage.trim(), ...chatHistory.slice(0, 9)];
        setChatHistory(newHistory);
        localStorage.setItem('healthcare_chat_history', JSON.stringify(newHistory));

        // Clear input
        setInputMessage('');

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
            // Get AI response
            const aiResponse = await ollamaService.generate(userMessage.content, true);

            // Replace loading message with actual response
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

            // Mark as error
            setMessages(prev => prev.map(msg =>
                msg.id === loadingMessage.id
                    ? {
                        ...msg,
                        content: 'Sorry, I encountered an error. Please try again.',
                        isLoading: false,
                        error: true,
                    }
                    : msg
            ));
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickAction = (prompt: string) => {
        setInputMessage(prompt);
        inputRef.current?.focus();
    };

    const handleClearChat = () => {
        if (window.confirm('Clear all chat messages?')) {
            setMessages([
                {
                    id: '1',
                    content: 'Hello! I am Healthcare+ AI Assistant. How can I assist you today?',
                    role: 'assistant',
                    timestamp: new Date(),
                }
            ]);
        }
    };

    const handleExportChat = () => {
        const chatText = messages.map(msg =>
            `${msg.role === 'user' ? 'You' : 'AI Assistant'} (${msg.timestamp.toLocaleString()}):\n${msg.content}\n\n`
        ).join('---\n\n');

        const blob = new Blob([chatText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `healthcare-chat-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleVoiceInput = async () => {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            alert('Speech recognition is not supported in your browser.');
            return;
        }

        // @ts-ignore
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = 'en-IN';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setInputMessage(transcript);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
        };

        recognition.start();
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-neutral-900 dark:to-neutral-950">
            <Container>
                {/* Hero Section */}
                <div className="pt-8 pb-6 text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
                            <Bot className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Healthcare+ AI Assistant
                        </h1>
                    </div>
                    <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto">
                        Your personal AI health companion. Get instant help with symptoms, medicines, first aid, and health advice.
                    </p>

                    {/* Status Indicators */}
                    <div className="flex flex-wrap justify-center gap-4 mt-6">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 rounded-full shadow-sm">
                            {isOllamaAvailable ? (
                                <>
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                        AI Assistant Online
                                    </span>
                                </>
                            ) : (
                                <>
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                    <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                                        Basic Mode (Offline)
                                    </span>
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 rounded-full shadow-sm">
                            <Shield className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Processed by Groq AI
                            </span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 rounded-full shadow-sm">
                            <Clock className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                24/7 Available
                            </span>
                        </div>
                    </div>
                </div>

                {/* Disclaimer */}
                {showDisclaimer && (
                    <Card className="mb-6 border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
                        <div className="p-4">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-3">
                                    <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                                            Important Medical Disclaimer
                                        </h3>
                                        <p className="text-sm text-yellow-700 dark:text-yellow-400/80">
                                            I am an AI assistant and not a substitute for professional medical advice, diagnosis, or treatment.
                                            Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowDisclaimer(false)}
                                    className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-700"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Quick Actions */}
                <div className="mb-6">
                    <QuickActions onActionSelect={handleQuickAction} />
                </div>

                {/* Chat Container */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Main Chat Area */}
                    <div className="lg:col-span-3">
                        <Card className="h-[500px] lg:h-[600px] flex flex-col">
                            {/* Chat Header */}
                            <div className="border-b border-neutral-200 dark:border-neutral-700 p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
                                            <Sparkles className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-neutral-900 dark:text-white">
                                                AI Health Assistant
                                            </h3>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                Powered by {isOllamaAvailable ? 'hosted AI' : 'Healthcare Knowledge Base'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            leftIcon={<History className="w-4 h-4" />}
                                            onClick={() => {
                                                if (chatHistory.length > 0) {
                                                    const randomPrompt = chatHistory[Math.floor(Math.random() * chatHistory.length)];
                                                    setInputMessage(randomPrompt);
                                                }
                                            }}
                                            disabled={chatHistory.length === 0}
                                        >
                                            History
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            leftIcon={<Download className="w-4 h-4" />}
                                            onClick={handleExportChat}
                                        >
                                            Export
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            leftIcon={<Trash2 className="w-4 h-4" />}
                                            onClick={handleClearChat}
                                        >
                                            Clear
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Messages Container */}
                            <div className="flex-1 overflow-y-auto p-4">
                                {messages.map((message) => (
                                    <ChatMessageBubble key={message.id} message={message} />
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="border-t border-neutral-200 dark:border-neutral-700 p-4">
                                <div className="flex gap-3">
                                    <Input
                                        ref={inputRef}
                                        placeholder="Describe your symptoms or ask a health question..."
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        className="flex-1"
                                        disabled={isLoading}
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            variant="secondary"
                                            onClick={handleVoiceInput}
                                            disabled={isLoading}
                                            title="Voice Input"
                                        >
                                            <Mic className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            onClick={handleSendMessage}
                                            disabled={!inputMessage.trim() || isLoading}
                                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                        >
                                            {isLoading ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                    <span>Thinking...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <Send className="w-4 h-4 mr-2" />
                                                    Send
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {/* Suggestions */}
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <span className="text-sm text-neutral-500 dark:text-neutral-400 mr-2">
                                        Try asking:
                                    </span>
                                    {['Headache relief?', 'Diabetes diet tips', 'Fever in children', 'Stress management'].map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            onClick={() => setInputMessage(suggestion)}
                                            className="px-3 py-1 text-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Side Panel */}
                    <div className="lg:col-span-1">
                        <div className="space-y-6">
                            {/* Capabilities Card */}
                            <Card className="p-5 bg-gradient-to-b from-blue-50 to-white dark:from-blue-900/20 dark:to-transparent">
                                <h4 className="font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    What I Can Help With
                                </h4>
                                <ul className="space-y-2">
                                    {[
                                        'Symptom analysis & guidance',
                                        'Medicine information & side effects',
                                        'First aid & emergency procedures',
                                        'Chronic condition management',
                                        'Mental health support',
                                        'Child & elderly care advice',
                                        'Diet & nutrition guidance',
                                        'Exercise recommendations',
                                        'Preventive healthcare tips',
                                        'Doctor/hospital recommendations'
                                    ].map((item) => (
                                        <li key={item} className="flex items-start gap-2 text-sm">
                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></div>
                                            <span className="text-neutral-700 dark:text-neutral-300">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </Card>

                            {/* Emergency Card */}
                            <Card className="p-5 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                                <h4 className="font-semibold text-red-800 dark:text-red-300 mb-3 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5" />
                                    Emergency Help
                                </h4>
                                <p className="text-sm text-red-700 dark:text-red-400/80 mb-3">
                                    For immediate medical emergencies:
                                </p>
                                <div className="space-y-2">
                                    <Button
                                        variant="danger"
                                        className="w-full justify-center"
                                        onClick={() => window.location.href = '/map-prediction'}
                                    >
                                        🏥 Find Nearest Hospital
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        className="w-full justify-center"
                                        onClick={() => window.location.href = '/doctors'}
                                    >
                                        👨‍⚕️ Book Doctor Appointment
                                    </Button>
                                </div>
                                <div className="mt-4 p-3 bg-white dark:bg-red-900/30 rounded-lg">
                                    <p className="text-sm font-medium text-red-800 dark:text-red-300">
                                        📞 National Emergency: 112
                                    </p>
                                    <p className="text-xs text-red-700 dark:text-red-400/80 mt-1">
                                        Ambulance • Police • Fire
                                    </p>
                                </div>
                            </Card>

                            {/* Stats Card */}
                            <Card className="p-5">
                                <h4 className="font-semibold text-neutral-900 dark:text-white mb-4">
                                    Chat Statistics
                                </h4>
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-neutral-600 dark:text-neutral-400">Messages</span>
                                            <span className="font-medium">{messages.length}</span>
                                        </div>
                                        <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                                                style={{ width: `${Math.min(messages.length * 10, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-neutral-600 dark:text-neutral-400">AI Status</span>
                                            <span className={`font-medium ${isOllamaAvailable ? 'text-green-600' : 'text-yellow-600'}`}>
                                                {isOllamaAvailable ? 'Online' : 'Limited'}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-neutral-600 dark:text-neutral-400">Session Time</span>
                                            <span className="font-medium">
                                                {new Date().getHours().toString().padStart(2, '0')}:
                                                {new Date().getMinutes().toString().padStart(2, '0')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="mt-12">
                    <h3 className="text-2xl font-bold text-center text-neutral-900 dark:text-white mb-8">
                        Why Choose Our AI Health Assistant?
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                icon: '🔒',
                                title: 'Privacy Notice',
                                description: 'Your messages are sent to our AI provider, Groq, to generate replies. Avoid sharing names or ID numbers.'
                            },
                            {
                                icon: '⚡',
                                title: 'Instant Responses',
                                description: 'Get medical guidance in seconds, 24/7 availability'
                            },
                            {
                                icon: '🇮🇳',
                                title: 'India-Focused',
                                description: 'Tailored for Indian healthcare system & medicines'
                            },
                            {
                                icon: '🎯',
                                title: 'Verified Information',
                                description: 'Medical guidelines from trusted healthcare sources'
                            }
                        ].map((feature, index) => (
                            <Card key={index} className="p-6 text-center hover-lift transition-all">
                                <div className="text-3xl mb-4">{feature.icon}</div>
                                <h4 className="font-bold text-neutral-900 dark:text-white mb-2">
                                    {feature.title}
                                </h4>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                    {feature.description}
                                </p>
                            </Card>
                        ))}
                    </div>
                </div>
            </Container>
        </div>
    );
};