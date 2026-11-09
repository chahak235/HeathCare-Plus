import React, { useEffect, useState } from 'react';
import { AlertTriangle, Bell, CheckCircle, X, Clock, User } from 'lucide-react';
import { useSocket } from '../../../hooks/useSocket';
import { useAuth } from '../../../contexts/AuthContext';

interface Alert {
  id: string;
  patientName: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'emergency';
  message: string;
  details: {
    symptoms?: string[];
    requiredSpecialty?: string;
    estimatedArrival?: string;
    doctorName?: string;
    bedType?: string;
  };
  createdAt: string;
}

export const AlertBanner: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const { socket } = useSocket();
  const { user } = useAuth();

  // Request notification permission on mount
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('alert:new', (alert: Alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 5));
      
      // Play sound for emergency alerts
      if (alert.priority === 'emergency') {
        const audio = new Audio('/sounds/emergency.mp3');
        audio.play().catch(() => console.log('Audio play failed'));
      }

      // Show browser notification
      if (Notification.permission === 'granted') {
        new Notification(alert.message, {
          body: `${alert.patientName} - ${alert.details.requiredSpecialty || 'General'}`,
          icon: '/favicon.ico',
          tag: alert.id,
          requireInteraction: alert.priority === 'emergency'
        });
      }
    });

    socket.on('alert:acknowledged', (data) => {
      setAlerts(prev => prev.filter(a => a.id !== data.alertId));
    });

    return () => {
      socket.off('alert:new');
      socket.off('alert:acknowledged');
    };
  }, [socket]);

  const acknowledgeAlert = (alertId: string) => {
    socket?.emit('alert:acknowledge', {
      alertId,
      userId: user?.id,
      userName: user?.name,
      role: user?.role
    });
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  const getPriorityStyles = (priority: string) => {
    switch(priority) {
      case 'emergency':
        return 'bg-gradient-to-r from-red-600 to-red-500 border-l-4 border-red-800';
      case 'high':
        return 'bg-gradient-to-r from-orange-500 to-orange-400 border-l-4 border-orange-700';
      case 'medium':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-400 border-l-4 border-yellow-700';
      default:
        return 'bg-gradient-to-r from-blue-500 to-blue-400 border-l-4 border-blue-700';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch(priority) {
      case 'emergency':
        return <AlertTriangle className="w-5 h-5 animate-pulse" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 w-96 space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`
            rounded-lg shadow-2xl p-4 transform transition-all duration-300 hover:scale-105
            animate-slideInRight text-white ${getPriorityStyles(alert.priority)}
          `}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="mt-0.5">
                {getPriorityIcon(alert.priority)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-sm">{alert.message}</h4>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                    {alert.type?.replace('_', ' ') || 'Alert'}
                  </span>
                </div>
                
                <p className="text-sm font-medium mb-2">{alert.patientName}</p>
                
                {alert.details.symptoms && alert.details.symptoms.length > 0 && (
                  <div className="text-xs bg-white/10 rounded p-2 mb-2">
                    <span className="font-semibold">Symptoms:</span>{' '}
                    {alert.details.symptoms.join(', ')}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                  {alert.details.requiredSpecialty && (
                    <div className="bg-white/10 rounded px-2 py-1">
                      <span className="font-semibold">Specialty:</span>{' '}
                      {alert.details.requiredSpecialty}
                    </div>
                  )}
                  
                  {alert.details.estimatedArrival && (
                    <div className="bg-white/10 rounded px-2 py-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>ETA: {new Date(alert.details.estimatedArrival).toLocaleTimeString()}</span>
                    </div>
                  )}

                  {alert.details.doctorName && (
                    <div className="bg-white/10 rounded px-2 py-1 flex items-center gap-1 col-span-2">
                      <User className="w-3 h-3" />
                      <span>Doctor: {alert.details.doctorName}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs opacity-75">
                    {new Date(alert.createdAt).toLocaleTimeString()}
                  </span>
                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="px-3 py-1 bg-white text-gray-800 rounded-lg text-xs font-semibold hover:bg-gray-100 transition-colors flex items-center gap-1"
                  >
                    <CheckCircle className="w-3 h-3" />
                    Acknowledge
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
