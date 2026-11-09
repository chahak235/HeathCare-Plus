import React from 'react';
import { Link } from 'react-router-dom';
import { GlassCard } from '../../components/layout/GlassCard';
import { Button } from '../../components/ui/Button';
import { OccupancyMetrics } from '../../components/features/command-center/OccupancyMetrics';
import { PriorityQueue } from '../../components/features/command-center/PriorityQueue';
import { AmbulanceTracker } from '../../components/features/command-center/AmbulanceTracker';
import { DoctorStatusPanel } from '../../components/features/command-center/DoctorStatusPanel';
import type { DashboardTab } from './types';
import type { OccupancyMetrics as OccupancyMetricsType, SpecialtyOccupancy } from '../../types/bed.types';
import type { TriagePatient } from '../../types/bed.types';
import type { Ambulance, DoctorStatus } from '../../types/bed.types';

interface OverviewTabProps {
  onTabChange: (tab: DashboardTab) => void;
  triagePatients: TriagePatient[];
  ambulances: Ambulance[];
  doctors: DoctorStatus[];
  metrics: OccupancyMetricsType;
  bySpecialty: SpecialtyOccupancy[];
  onFilterChange: (specialty: string | null) => void;
  onAssignDoctor: (patientId: string, doctorId: string) => void;
  onViewPatientDetails: (patientId: string) => void;
  onAmbulanceSelect: (id: string) => void;
  onDispatchAmbulance: (ambulanceId: string, hospitalId: string) => void;
  onCallDoctor: (doctorId: string) => void;
  onViewDoctorSchedule: (doctorId: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  onTabChange,
  triagePatients,
  ambulances,
  doctors,
  metrics,
  bySpecialty,
  onFilterChange,
  onAssignDoctor,
  onViewPatientDetails,
  onAmbulanceSelect,
  onDispatchAmbulance,
  onCallDoctor,
  onViewDoctorSchedule,
}) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-1">
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold font-heading text-neutral-900 dark:text-white">
            Priority Queue
          </h2>
          <Button variant="ghost" size="sm" onClick={() => onTabChange('triage')}>
            View All
          </Button>
        </div>
        <PriorityQueue
          patients={triagePatients.slice(0, 3)}
          onAssignDoctor={onAssignDoctor}
          onViewDetails={onViewPatientDetails}
        />
      </GlassCard>
    </div>

    <div className="lg:col-span-1">
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold font-heading text-neutral-900 dark:text-white">
            Bed Occupancy
          </h2>
          <Button variant="ghost" size="sm" onClick={() => onTabChange('beds')}>
            View All
          </Button>
        </div>
        <OccupancyMetrics
          metrics={metrics}
          bySpecialty={bySpecialty.slice(0, 4)}
          onFilter={onFilterChange}
        />
      </GlassCard>
    </div>

    <div className="lg:col-span-1 space-y-6">
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold font-heading text-neutral-900 dark:text-white">
            Incoming Ambulances
          </h2>
          <Button variant="ghost" size="sm" onClick={() => onTabChange('ambulances')}>
            View All
          </Button>
        </div>
        <AmbulanceTracker
          ambulances={ambulances.filter((a) => a.status === 'enroute').slice(0, 2)}
          onSelectAmbulance={onAmbulanceSelect}
          onDispatchToHospital={onDispatchAmbulance}
        />
      </GlassCard>

      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold font-heading text-neutral-900 dark:text-white">
            Doctors on Duty
          </h2>
          <Button variant="ghost" size="sm" onClick={() => onTabChange('doctors')}>
            View All
          </Button>
        </div>
        <DoctorStatusPanel
          doctors={doctors.filter((d) => d.isOnDuty).slice(0, 2)}
          onCallDoctor={onCallDoctor}
          onViewSchedule={onViewDoctorSchedule}
        />
      </GlassCard>
    </div>
  </div>
);
