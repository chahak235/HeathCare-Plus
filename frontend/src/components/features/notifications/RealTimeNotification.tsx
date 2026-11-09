import React, { useEffect, useState } from 'react';
import { useRealtime } from '../../../contexts/RealtimeContext';
import { Bell, X, Calendar, AlertTriangle, Video, MessageSquare } from 'lucide-react';

// Notification sound (using Web Audio API). Browsers throw if an
// AudioContext is created/resumed before any user gesture on the page —
// this ran inside a useEffect with no guard, so the very first socket
// notification after a fresh page load could throw an uncaught error here
// and, with no error boundary anywhere in the app (see ErrorBoundary.tsx,
// added alongside this fix), take down the entire page.
const playNotificationSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    gainNode.gain.value = 0.5;

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (err) {
    console.warn('Could not play notification sound:', err);
  }
};

export const RealTimeNotification: React.FC = () => {
  const [toast, setToast] = useState<any>(null);
  const { notifications = [], emergencies = [], latestNotification, clearLatestNotification } = useRealtime() as any;
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (latestNotification) {
      setToast(latestNotification);
      playNotificationSound();
      
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      
      if (clearLatestNotification) {
        clearLatestNotification();
      }
      
      return () => clearTimeout(timer);
    }
  }, [latestNotification, clearLatestNotification]);

  useEffect(() => {
    if (notifications?.length > 0 || emergencies?.length > 0) {
      // Show browser notification if permitted. Guarded: the Notification
      // API doesn't exist in every context (some in-app webviews), and
      // browsers can throw when constructing one outside a user gesture.
      try {
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('Healthcare+ Update', {
            body: 'You have new notifications',
            icon: '/favicon.ico'
          });
        }
      } catch (err) {
        console.warn('Could not show browser notification:', err);
      }
    }
    setUnreadCount((notifications?.length || 0) + (emergencies?.length || 0));
  }, [notifications, emergencies]);

  // Request notification permission on mount
  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const getIcon = (type: string) => {
    switch(type) {
      case 'emergency': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'appointment': return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'video': return <Video className="w-5 h-5 text-green-500" />;
      default: return <MessageSquare className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 hover:bg-gray-100 rounded-full"
        >
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {showNotifications && (
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border max-h-96 overflow-y-auto z-50">
            <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold">Notifications</h3>
              <button onClick={() => setShowNotifications(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Emergency Alerts - Always on top */}
            {emergencies?.map((emergency: any, index: number) => (
              <div key={index} className="p-4 border-b bg-red-50 hover:bg-red-100 cursor-pointer animate-pulse">
                <div className="flex items-start gap-3">
                  {getIcon('emergency')}
                  <div>
                    <p className="font-bold text-red-700">{emergency.type} Emergency</p>
                    <p className="text-sm text-red-600">{emergency.message}</p>
                    <p className="text-xs text-red-400 mt-1">
                      {new Date(emergency.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Regular Notifications */}
            {notifications?.map((notif: any, index: number) => (
              <div key={index} className="p-4 border-b hover:bg-gray-50 cursor-pointer">
                <div className="flex items-start gap-3">
                  {getIcon(notif.type)}
                  <div>
                    <p className="font-medium">{notif.title}</p>
                    <p className="text-sm text-gray-600">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notif.timestamp || new Date()).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {notifications?.length === 0 && emergencies?.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No new notifications
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Toast Popup */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-slideInRight">
          <div className="bg-white rounded-lg shadow-xl border border-gray-100 p-4 max-w-sm flex items-start gap-3 relative">
            <button 
              onClick={() => setToast(null)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="mt-1 bg-blue-50 p-2 rounded-full">
              {getIcon(toast.type || 'message')}
            </div>
            <div className="pr-6">
              <h4 className="font-bold text-gray-900">{toast.title}</h4>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{toast.message}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
