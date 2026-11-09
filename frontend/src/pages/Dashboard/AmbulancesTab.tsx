import React from 'react';
import { Link } from 'react-router-dom';
import { GlassCard } from '../../components/layout/GlassCard';
import { Button } from '../../components/ui/Button';
import { AmbulanceTracker } from '../../components/features/command-center/AmbulanceTracker';
import { Truck } from 'lucide-react';
import type { Ambulance } from '../../types/bed.types';

interface AmbulancesTabProps {
  ambulances: Ambulance[];
  onSelectAmbulance: (id: string) => void;
  onDispatchAmbulance: (ambulanceId: string, hospitalId: string) => void;
}

export const AmbulancesTab: React.FC<AmbulancesTabProps> = ({
  ambulances,
  onSelectAmbulance,
  onDispatchAmbulance,
}) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-2">
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold font-heading text-neutral-900 dark:text-white">
            Live Ambulance Tracking
          </h2>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">
              Map View
            </Button>
            <Button variant="primary" size="sm">
              Dispatch New
            </Button>
          </div>
        </div>
        <AmbulanceTracker
          ambulances={ambulances}
          onSelectAmbulance={onSelectAmbulance}
          onDispatchToHospital={onDispatchAmbulance}
        />
      </GlassCard>
    </div>

    <div className="lg:col-span-1">
      <GlassCard className="p-4 h-full">
        <h2 className="text-lg font-bold font-heading text-neutral-900 dark:text-white mb-4">
          Live Map
        </h2>
        <Link to="/map-prediction">
          <div className="aspect-square bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
            <div className="text-center">
              <Truck className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <p className="text-sm text-neutral-500">Click to view full map</p>
              <p className="text-xs text-neutral-400 mt-1">
                {ambulances.filter((a) => a.status === 'enroute').length} ambulances enroute
              </p>
            </div>
          </div>
        </Link>
      </GlassCard>
    </div>
  </div>
);
