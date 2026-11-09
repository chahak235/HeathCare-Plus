/**
 * ConnectionStatus Component
 * Displays WebSocket connection status with visual indicators
 */

import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';

interface ConnectionStatusProps {
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  lastUpdated: string;
  onRefresh: () => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  status,
  lastUpdated,
  onRefresh,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: Wifi,
          color: 'text-medical-green',
          bgColor: 'bg-medical-green/10',
          label: 'Live',
          badgeVariant: 'success' as const,
        };
      case 'connecting':
        return {
          icon: Wifi,
          color: 'text-medical-yellow',
          bgColor: 'bg-medical-yellow/10',
          label: 'Connecting',
          badgeVariant: 'warning' as const,
        };
      case 'error':
        return {
          icon: WifiOff,
          color: 'text-medical-red',
          bgColor: 'bg-medical-red/10',
          label: 'Error',
          badgeVariant: 'danger' as const,
        };
      default:
        return {
          icon: WifiOff,
          color: 'text-neutral-400',
          bgColor: 'bg-neutral-100 dark:bg-neutral-800',
          label: 'Disconnected',
          badgeVariant: 'outline' as const,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const formatLastUpdated = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);

    if (diffSec < 5) return 'just now';
    if (diffSec < 60) return `${diffSec} seconds ago`;
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    return date.toLocaleTimeString();
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
      <div className={`p-2 rounded-full ${config.bgColor}`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>
      
      <div className="flex items-center gap-2">
        <Badge variant={config.badgeVariant}>{config.label}</Badge>
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          Updated {formatLastUpdated(lastUpdated)}
        </span>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onRefresh}
        leftIcon={<RefreshCw className="w-4 h-4" />}
        className="ml-2"
      >
        Refresh
      </Button>
    </div>
  );
};