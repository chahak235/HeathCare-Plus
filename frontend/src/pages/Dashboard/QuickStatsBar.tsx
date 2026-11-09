import React from 'react';
import { AlertTriangle, Truck, Activity, Users, BarChart3 } from 'lucide-react';
import { GlassCard } from '../../components/layout/GlassCard';

interface QuickStatsBarProps {
  p1Patients: number;
  incomingAmbulances: number;
  availableEmergencyBeds: number;
  criticalDoctors: number;
  occupancyPercentage: number;
}

export const QuickStatsBar: React.FC<QuickStatsBarProps> = ({
  p1Patients,
  incomingAmbulances,
  availableEmergencyBeds,
  criticalDoctors,
  occupancyPercentage,
}) => (
  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
    <GlassCard className="p-3">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-medical-red/10 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-medical-red" />
        </div>
        <div>
          <p className="text-xs text-neutral-500">Priority 1</p>
          <p className="text-lg font-bold text-medical-red">{p1Patients}</p>
        </div>
      </div>
    </GlassCard>
    <GlassCard className="p-3">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-medical-orange/10 rounded-lg">
          <Truck className="w-4 h-4 text-medical-orange" />
        </div>
        <div>
          <p className="text-xs text-neutral-500">Incoming</p>
          <p className="text-lg font-bold text-medical-orange">{incomingAmbulances}</p>
        </div>
      </div>
    </GlassCard>
    <GlassCard className="p-3">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-medical-green/10 rounded-lg">
          <Activity className="w-4 h-4 text-medical-green" />
        </div>
        <div>
          <p className="text-xs text-neutral-500">ER Beds</p>
          <p className="text-lg font-bold text-medical-green">{availableEmergencyBeds}</p>
        </div>
      </div>
    </GlassCard>
    <GlassCard className="p-3">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-medical-cyan/10 rounded-lg">
          <Users className="w-4 h-4 text-medical-cyan" />
        </div>
        <div>
          <p className="text-xs text-neutral-500">Critical Dr.</p>
          <p className="text-lg font-bold text-medical-cyan">{criticalDoctors}</p>
        </div>
      </div>
    </GlassCard>
    <GlassCard className="p-3">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
          <BarChart3 className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
        </div>
        <div>
          <p className="text-xs text-neutral-500">Occupancy</p>
          <p className="text-lg font-bold text-neutral-900 dark:text-white">{occupancyPercentage}%</p>
        </div>
      </div>
    </GlassCard>
  </div>
);
