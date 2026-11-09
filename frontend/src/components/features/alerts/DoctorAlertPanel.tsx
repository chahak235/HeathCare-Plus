import React, { useEffect, useState } from 'react';
import { useSocket } from '../../../hooks/useSocket';
import { useAuth } from '../../../contexts/AuthContext';
import { Bell, AlertTriangle, CheckCircle, Clock, User, Activity, Heart } from 'lucide-react';

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
    priority?: number;
  };
  createdAt: string;
}

export const DoctorAlertPanel: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const { socket } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    if (!socket) return;

    socket.on('alert:new', (alert: Alert) => {
      // Only show alerts relevant to this doctor's specialty
      if (user?.role === 'doctor' && 
          alert.details.requiredSpecialty && 
          alert.details.requiredSpecialty !== user.specialty) {
        return;
      }
      setAlerts(prev => [alert, ...prev]);
    });

    socket.on('alert:acknowledged', (data) => {
      setAlerts(prev => prev.filter(a => a.id !== data.alertId));
    });

    return () => {
      socket.off('alert:new');
      socket.off('alert:acknowledged');
    };
  }, [socket, user]);

  const acknowledgeAlert = (alertId: string) => {
    socket?.emit('alert:acknowledge', {
      alertId,
      userId: user?.id,
      userName: user?.name,
      role: user?.role
    });
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'emergency': return 'bg-red-50 border-red-500 text-red-700';
      case 'high': return 'bg-orange-50 border-orange-500 text-orange-700';
      case 'medium': return 'bg-yellow-50 border-yellow-500 text-yellow-700';
      default: return 'bg-blue-50 border-blue-500 text-blue-700';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch(priority) {
      case 'emergency': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'high': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'medium': return <Bell className="w-5 h-5 text-yellow-500" />;
      default: return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
        <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">No active alerts</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">All patients are stable</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Activity className="w-5 h-5 text-red-500" />
          Active Alerts ({alerts.length})
        </h3>
        <span className="text-xs text-gray-500">
          {alerts.filter(a => a.priority === 'emergency').length} Emergency
        </span>
      </div>
      
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`border-l-4 rounded-lg p-4 ${getPriorityColor(alert.priority)} bg-opacity-50 hover:bg-opacity-75 transition-all cursor-pointer`}
            onClick={() => acknowledgeAlert(alert.id)}
          >
            <div className="flex items-start gap-3">
              {getPriorityIcon(alert.priority)}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-bold">{alert.patientName}</h4>
                    <p className="text-sm opacity-90">{alert.message}</p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-white/50 rounded-full">
                    P{alert.details.priority || '?'}
                  </span>
                </div>
                
                {alert.details.symptoms && alert.details.symptoms.length > 0 && (
                  <div className="text-sm mb-2 flex flex-wrap gap-1">
                    {alert.details.symptoms.slice(0, 3).map((symptom, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-white/50 rounded-full text-xs">
                        {symptom}
                      </span>
                    ))}
                    {alert.details.symptoms.length > 3 && (
                      <span className="text-xs opacity-75">+{alert.details.symptoms.length - 3} more</span>
                    )}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                  {alert.details.requiredSpecialty && (
                    <div className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      <span>{alert.details.requiredSpecialty}</span>
                    </div>
                  )}
                  
                  {alert.details.estimatedArrival && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>ETA: {new Date(alert.details.estimatedArrival).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-3 text-xs opacity-75">
                  <span>{new Date(alert.createdAt).toLocaleString()}</span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Click to acknowledge
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
