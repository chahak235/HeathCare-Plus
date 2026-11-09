import React from 'react';
import { Chat } from './Chat';

export const ChatPublic: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-blue-600">
              Healthcare+ AI Assistant (Public Test Mode)
            </h1>
            <a 
              href="/login" 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Login for Full Access
            </a>
          </div>
          <p className="text-gray-600 mb-4">
            ⚠️ <strong>Note:</strong> This is a public test version. Some features may be limited.
          </p>
        </div>
        <Chat />
      </div>
    </div>
  );
};