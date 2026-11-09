import React from 'react';
import { Bot, User, AlertCircle, Clock, CheckCircle, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessageBubbleProps {
  message: {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
    isLoading?: boolean;
    error?: boolean;
  };
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const timeString = message.timestamp.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`max-w-[85%] lg:max-w-[75%] ${isUser ? 'order-2' : 'order-1'}`}>
        <div className="flex items-center gap-2 mb-2">
          <div className={`flex items-center gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
            <div className={`p-2 rounded-full ${isUser ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
              {isUser ? (
                <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              ) : (
                <Bot className="w-4 h-4 text-green-600 dark:text-green-400" />
              )}
            </div>
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {isUser ? 'You' : 'Healthcare AI'}
            </span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {timeString}
            </span>
          </div>
        </div>

        <div className={`
          rounded-2xl p-4 relative
          ${isUser 
            ? 'bg-blue-500 text-white rounded-tr-none' 
            : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-tl-none'
          }
          ${message.error ? 'border-red-300 dark:border-red-700' : ''}
        `}>
          {/* Loading indicator */}
          {message.isLoading && !isUser && (
            <div className="flex items-center gap-2 mb-2">
              <div className="animate-pulse flex space-x-1">
                <div className="w-2 h-2 bg-neutral-400 rounded-full"></div>
                <div className="w-2 h-2 bg-neutral-400 rounded-full animation-delay-200"></div>
                <div className="w-2 h-2 bg-neutral-400 rounded-full animation-delay-400"></div>
              </div>
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                AI is thinking...
              </span>
            </div>
          )}

          {/* Error state */}
          {message.error && (
            <div className="flex items-center gap-2 mb-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700 dark:text-red-300">
                Unable to get response. Please try again.
              </span>
            </div>
          )}

          {/* Message content */}
          {!message.isLoading && (
            <div className={isUser ? 'text-white' : 'text-neutral-800 dark:text-neutral-200'}>
              {isUser ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      strong: ({ children }) => (
                        <strong className="font-semibold text-neutral-900 dark:text-white">
                          {children}
                        </strong>
                      ),
                      p: ({ children }) => (
                        <p className="mb-3 last:mb-0">{children}</p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          )}

          {/* Status indicator */}
          <div className={`absolute -bottom-2 ${isUser ? 'right-4' : 'left-4'}`}>
            {message.isLoading ? (
              <Clock className="w-4 h-4 text-neutral-400 animate-pulse" />
            ) : message.error ? (
              <AlertCircle className="w-4 h-4 text-red-500" />
            ) : (
              <CheckCircle className={`w-4 h-4 ${isUser ? 'text-blue-300' : 'text-green-500'}`} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};