import React from 'react';
import { Badge } from '../../components/ui/Badge';
import type { DashboardTab } from './types';
import type { Bed } from '../../types/bed.types';
import type { TriagePatient } from '../../types/bed.types';
import type { Ambulance } from '../../types/bed.types';
import type { DoctorStatus } from '../../types/bed.types';

interface DashboardTabsProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  beds: Bed[];
  triagePatients: TriagePatient[];
  ambulances: Ambulance[];
  doctors: DoctorStatus[];
}

export const DashboardTabs: React.FC<DashboardTabsProps> = ({
  activeTab,
  onTabChange,
  beds,
  triagePatients,
  ambulances,
  doctors,
}) => {
  const tabs: { id: DashboardTab; label: string; badge?: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview' },
    { 
      id: 'beds', 
      label: 'Bed Management',
      badge: beds.filter(b => b.status === 'occupied').length > 0 ? (
        <Badge variant="danger" size="sm" className="ml-2">
          {beds.filter(b => b.status === 'occupied').length}
        </Badge>
      ) : undefined
    },
    { 
      id: 'triage', 
      label: 'Priority Queue',
      badge: triagePatients.filter(p => p.priority <= 2).length > 0 ? (
        <Badge variant="danger" size="sm" className="ml-2">
          {triagePatients.filter(p => p.priority <= 2).length}
        </Badge>
      ) : undefined
    },
    { 
      id: 'ambulances', 
      label: 'Ambulance Tracking',
      badge: ambulances.filter(a => a.status === 'enroute').length > 0 ? (
        <Badge variant="warning" size="sm" className="ml-2">
          {ambulances.filter(a => a.status === 'enroute').length}
        </Badge>
      ) : undefined
    },
    { 
      id: 'doctors', 
      label: 'Doctor Status',
      badge: doctors.filter(d => d.isOnDuty).length > 0 ? (
        <Badge variant="success" size="sm" className="ml-2">
          {doctors.filter(d => d.isOnDuty).length} on duty
        </Badge>
      ) : undefined
    },
    { 
      id: 'analytics', 
      label: 'Analytics',
      badge: <Badge variant="info" size="sm" className="ml-2">LIVE</Badge>
    },
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