import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, Bell, Settings, Download } from 'lucide-react';
import { ConnectionStatus } from '../../components/features/command-center/ConnectionStatus';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import type { ConnectionStatus as ConnectionStatusType } from '../../services/socket-service';

interface DashboardHeaderProps {
  connectionStatus: ConnectionStatusType;
  lastUpdated: string;
  onRefresh: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  connectionStatus,
  lastUpdated,
  onRefresh,
}) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-medical-cyan/10 rounded-lg">
          <LayoutGrid className="w-6 h-6 text-medical-cyan" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold font-heading text-neutral-900 dark:text-white">
          Hospital Command Center
        </h1>
        <Badge variant="info" size="sm" className="ml-2">
          LIVE
        </Badge>
      </div>
      <p className="text-neutral-600 dark:text-neutral-400 font-body text-sm">
        Real-time bed allocation, emergency triage, and hospital operations
      </p>
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <ConnectionStatus status={connectionStatus} lastUpdated={lastUpdated} onRefresh={onRefresh} />
      <Button variant="ghost" size="sm" leftIcon={<Bell className="w-4 h-4" />}>
        Alerts
      </Button>
      <Button variant="ghost" size="sm" leftIcon={<Settings className="w-4 h-4" />}>
        Settings
      </Button>
      <Button variant="primary" size="sm" leftIcon={<Download className="w-4 h-4" />}>
        Report
      </Button>
    </div>
  </div>
);
