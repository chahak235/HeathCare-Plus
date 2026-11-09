import React from 'react';
import { format } from 'date-fns';
import { User, Eye, Edit, Download, Lock } from 'lucide-react';

interface AuditEvent {
  id: string;
  timestamp: Date;
  user: string;
  role: string;
  action: 'view' | 'edit' | 'export' | 'login' | 'logout';
  resource: string;
  details?: string;
  ipAddress?: string;
}

interface AuditTrailProps {
  events: AuditEvent[];
  maxHeight?: string;
}

export const AuditTrail: React.FC<AuditTrailProps> = ({ events, maxHeight = '400px' }) => {
  const actionIcons = {
    view: <Eye className="w-4 h-4 text-blue-500" />,
    edit: <Edit className="w-4 h-4 text-amber-500" />,
    export: <Download className="w-4 h-4 text-green-500" />,
    login: <Lock className="w-4 h-4 text-purple-500" />,
    logout: <Lock className="w-4 h-4 text-neutral-500" />,
  };

  return (
    <div className="border border-neutral-200 dark:border-neutral-700 rounded-clinical">
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
        <h3 className="font-semibold text-neutral-900 dark:text-white">
          Activity Audit Trail
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          HIPAA-compliant access logging
        </p>
      </div>
      <div className="overflow-y-auto" style={{ maxHeight }}>
        {events.map((event) => (
          <div
            key={event.id}
            className="p-4 border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            <div className="flex items-start">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 mr-3">
                {actionIcons[event.action]}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-neutral-900 dark:text-white">
                    {event.user}
                  </div>
                  <div className="text-sm text-neutral-500">
                    {format(event.timestamp, 'MMM d, yyyy HH:mm:ss')}
                  </div>
                </div>
                <div className="mt-1 flex items-center space-x-2">
                  <span className="text-sm px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded">
                    {event.role}
                  </span>
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    {event.action.toUpperCase()} • {event.resource}
                  </span>
                </div>
                {event.details && (
                  <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                    {event.details}
                  </p>
                )}
                {event.ipAddress && (
                  <div className="mt-2 text-xs text-neutral-500">
                    IP: {event.ipAddress}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};