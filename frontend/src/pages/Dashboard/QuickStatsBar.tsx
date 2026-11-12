import React from 'react';
import { AlertTriangle, Activity, Users, BarChart3 } from 'lucide-react';
import { GlassCard } from '../../components/layout/GlassCard';

interface QuickStatsBarProps {
  openSos: number;
  availableEmergencyBeds: number;
  emergencyDoctors: number;
  occupancyPercentage: number;
}

const Stat: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode; tone: string }> = ({ icon, label, value, tone }) => (
  <GlassCard className="p-3">
    <div className="flex items-center gap-2">
      <div className={`p-2 rounded-lg ${tone}`}>{icon}</div>
      <div>
        <p className="text-xs text-neutral-500">{label}</p>
        <p className="text-lg font-bold text-neutral-900 dark:text-white">{value}</p>
      </div>
    </div>
  </GlassCard>
);

/** Real figures only: open SOS alerts, beds and doctors from the database. */
export const QuickStatsBar: React.FC<QuickStatsBarProps> = ({ openSos, availableEmergencyBeds, emergencyDoctors, occupancyPercentage }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
    <Stat icon={<AlertTriangle className="w-4 h-4 text-medical-red" />} tone="bg-medical-red/10" label="Open SOS alerts" value={openSos} />
    <Stat icon={<Activity className="w-4 h-4 text-medical-green" />} tone="bg-medical-green/10" label="Free emergency beds" value={availableEmergencyBeds} />
    <Stat icon={<Users className="w-4 h-4 text-medical-cyan" />} tone="bg-medical-cyan/10" label="Emergency doctors" value={emergencyDoctors} />
    <Stat icon={<BarChart3 className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />} tone="bg-neutral-100 dark:bg-neutral-800" label="Bed occupancy" value={`${occupancyPercentage}%`} />
  </div>
);
