import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navigation } from '../components/layout/Navigation';
import { Footer } from '../components/layout/Footer';
import FloatingChatWidget from '../components/features/chat/FloatingChatWidget';
import { AlertBanner } from '../components/features/alerts/AlertBanner';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background-primary">
      <Navigation />
      <AlertBanner />
      <main className="flex-1 relative">
        <Outlet />
        <FloatingChatWidget />
      </main>
      <Footer />
    </div>
  );
};
