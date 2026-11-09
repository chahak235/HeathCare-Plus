import React, { useState, useEffect } from 'react';
import { Clock, Shield, LogOut } from 'lucide-react';
import { Button } from '../../ui/Button';

interface SessionManagerProps {
  timeoutMinutes?: number;
  onTimeout?: () => void;
  onExtend?: () => void;
  onLogout?: () => void;
}

export const SessionManager: React.FC<SessionManagerProps> = ({
  timeoutMinutes = 15,
  onTimeout,
  onExtend,
  onLogout,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(timeoutMinutes * 60);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          onTimeout?.();
          return 0;
        }
        if (prev <= 60) {
          setShowWarning(true);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onTimeout]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!showWarning && timeRemaining > 60) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-modal shadow-xl p-4 max-w-sm">
        <div className="flex items-start">
          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 mr-3">
            <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-neutral-900 dark:text-white mb-1">
              Session Timeout Warning
            </h4>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
              Your session will expire in{' '}
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {formatTime(timeRemaining)}
              </span>
              . For patient privacy, sessions automatically end after {timeoutMinutes} minutes of inactivity.
            </p>
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={() => {
                  setTimeRemaining(timeoutMinutes * 60);
                  setShowWarning(false);
                  onExtend?.();
                }}
              >
                Extend Session
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={onLogout}
                leftIcon={<LogOut className="w-4 h-4" />}
              >
                Logout Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};