import React from 'react';
import { Badge } from '../../components/ui/Badge';
import type { DashboardTab } from './types';
import type { Bed, DoctorStatus } from '../../types/bed.types';

interface DashboardTabsProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  beds: Bed[];
  doctors: DoctorStatus[];
  openSos: number;
}

export const DashboardTabs: React.FC<DashboardTabsProps> = ({ activeTab, onTabChange, beds, doctors, openSos }) => {
  const occupied = beds.filter((b) => b.status === 'occupied').length;
  const onDuty = doctors.filter((d) => d.isOnDuty).length;
  const tabs: { id: DashboardTab; label: string; badge?: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview' },
    {
      id: 'sos',
      label: 'SOS Alerts',
      badge: openSos > 0 ? <Badge variant="danger" size="sm" className="ml-2">{openSos}</Badge> : undefined,
    },
    { id: 'appointments', label: 'Appointments' },
    {
      id: 'beds',
      label: 'Bed Management',
      badge: occupied > 0 ? <Badge variant="warning" size="sm" className="ml-2">{occupied}</Badge> : undefined,
    },
    {
      id: 'doctors',
      label: 'Doctor Status',
      badge: onDuty > 0 ? <Badge variant="success" size="sm" className="ml-2">{onDuty} on duty</Badge> : undefined,
    },
    { id: 'analytics', label: 'Analytics' },
    { id: 'trust', label: 'Reviews & Access Log' },
  ];

  return (
    <div className="mb-6 border-b border-neutral-200 dark:border-neutral-700">
      <div className="flex flex-wrap gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center ${
              activeTab === tab.id
                ? 'text-medical-cyan border-b-2 border-medical-cyan'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
            {tab.badge}
          </button>
        ))}
      </div>
    </div>
  );
};
