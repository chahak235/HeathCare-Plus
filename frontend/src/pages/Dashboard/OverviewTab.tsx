import React from 'react';
import { Phone } from 'lucide-react';
import { GlassCard } from '../../components/layout/GlassCard';
import { Button } from '../../components/ui/Button';
import { OccupancyMetrics } from '../../components/features/command-center/OccupancyMetrics';
import { DoctorStatusPanel } from '../../components/features/command-center/DoctorStatusPanel';
import type { DashboardTab } from './types';
import type { OccupancyMetrics as OccupancyMetricsType, SpecialtyOccupancy, DoctorStatus } from '../../types/bed.types';
import type { SosAlert } from './SosTab';

interface OverviewTabProps {
  onTabChange: (tab: DashboardTab) => void;
  sosAlerts: SosAlert[];
  doctors: DoctorStatus[];
  metrics: OccupancyMetricsType;
  bySpecialty: SpecialtyOccupancy[];
  onFilterChange: (specialty: string | null) => void;
  onCallDoctor: (doctorId: string) => void;
  onViewDoctorSchedule: (doctorId: string) => void;
}

const Section: React.FC<{ title: string; onAll: () => void; children: React.ReactNode }> = ({ title, onAll, children }) => (
  <GlassCard className="p-4">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-bold font-heading text-neutral-900 dark:text-white">{title}</h2>
      <Button variant="ghost" size="sm" onClick={onAll}>View All</Button>
    </div>
    {children}
  </GlassCard>
);

export const OverviewTab: React.FC<OverviewTabProps> = ({
  onTabChange, sosAlerts, doctors, metrics, bySpecialty, onFilterChange, onCallDoctor, onViewDoctorSchedule,
}) => {
  const active = sosAlerts.filter((a) => a.status !== 'resolved').slice(0, 4);
  const onDuty = doctors.filter((d) => d.isOnDuty).slice(0, 3);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Section title="SOS Alerts" onAll={() => onTabChange('sos')}>
        {active.length === 0 ? (
          <p className="text-sm text-neutral-500">No open SOS alerts.</p>
        ) : (
          <ul className="space-y-3">
            {active.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
                <div>
                  <div className="font-medium text-neutral-900 dark:text-white">{a.patient.name}</div>
                  <div className="text-xs text-neutral-500">
                    {a.status}
                    {a.distanceKm != null && ` · ${a.distanceKm} km`}
                    {a.patient.bloodGroup && ` · ${a.patient.bloodGroup}`}
                  </div>
                </div>
                {a.patient.phone && (
                  <a href={`tel:${a.patient.phone}`} className="p-2 rounded-lg bg-primary-600 text-white" aria-label={`Call ${a.patient.name}`}>
                    <Phone className="w-4 h-4" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Bed Occupancy" onAll={() => onTabChange('beds')}>
        <OccupancyMetrics metrics={metrics} bySpecialty={bySpecialty.slice(0, 4)} onFilter={onFilterChange} />
      </Section>

      <Section title="Doctors on Duty" onAll={() => onTabChange('doctors')}>
        {onDuty.length === 0 ? (
          <p className="text-sm text-neutral-500">No doctors marked on duty.</p>
        ) : (
          <DoctorStatusPanel doctors={onDuty} onCallDoctor={onCallDoctor} onViewSchedule={onViewDoctorSchedule} />
        )}
      </Section>
    </div>
  );
};
