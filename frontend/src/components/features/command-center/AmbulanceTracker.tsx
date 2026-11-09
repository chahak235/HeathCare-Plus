/**
 * AmbulanceTracker Component
 * Live tracking of incoming ambulances with ETA
 */

import React, { useState } from 'react';
import {
  Truck as AmbulanceIcon,
  MapPin,
  Clock,
  Navigation,
  Phone,
  AlertTriangle,
  User,
  Building2,
} from 'lucide-react';
import type { Ambulance } from '../../../types/bed.types';
import { GlassCard } from '../../layout/GlassCard';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';

interface AmbulanceTrackerProps {
  ambulances: Ambulance[];
  onSelectAmbulance: (id: string) => void;
  onDispatchToHospital: (ambulanceId: string, hospitalId: string) => void;
}

export const AmbulanceTracker: React.FC<AmbulanceTrackerProps> = ({
  ambulances,
  onSelectAmbulance,
  onDispatchToHospital,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const incomingAmbulances = ambulances.filter(
    (a) => a.status === 'enroute' || a.status === 'at-hospital'
  );

  const getStatusColor = (status: Ambulance['status']) => {
    switch (status) {
      case 'enroute':
        return 'text-medical-orange';
      case 'at-hospital':
        return 'text-medical-green';
      case 'available':
        return 'text-medical-cyan';
      case 'maintenance':
        return 'text-neutral-400';
      default:
        return 'text-neutral-400';
    }
  };

  const getEtaDisplay = (ambulance: Ambulance) => {
    if (!ambulance.estimatedArrival) return 'Calculating...';
    
    const eta = new Date(ambulance.estimatedArrival);
    const now = new Date();
    const diffMin = Math.round((eta.getTime() - now.getTime()) / (1000 * 60));
    
    if (diffMin < 0) return 'Arrived';
    if (diffMin < 1) return '< 1 min';
    if (diffMin < 60) return `${diffMin} min`;
    return eta.toLocaleTimeString();
  };

  if (incomingAmbulances.length === 0) {
    return (
      <GlassCard className="p-8 text-center">
        <AmbulanceIcon className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
        <p className="text-neutral-500">No incoming ambulances</p>
        <p className="text-sm text-neutral-400 mt-1">All ambulances are currently available or offline</p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-3">
      {incomingAmbulances.map((ambulance) => (
        <GlassCard
          key={ambulance.id}
          className={`p-4 cursor-pointer transition-all ${
            selectedId === ambulance.id ? 'ring-2 ring-medical-cyan' : ''
          }`}
          onClick={() => {
            setSelectedId(ambulance.id);
            onSelectAmbulance(ambulance.id);
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg bg-opacity-10 ${getStatusColor(ambulance.status)} bg-current`}>
                <AmbulanceIcon className={`w-5 h-5 ${getStatusColor(ambulance.status)}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-neutral-900 dark:text-white">
                    {ambulance.vehicleNumber}
                  </h4>
                  <Badge
                    variant={
                      ambulance.type === 'icu'
                        ? 'danger'
                        : ambulance.type === 'advanced'
                        ? 'warning'
                        : 'info'
                    }
                    size="sm"
                  >
                    {ambulance.type.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-neutral-500">
                  {ambulance.paramedics?.join(' • ') || 'Paramedics assigned'}
                </p>
              </div>
            </div>
            <Badge
              variant={
                ambulance.status === 'enroute'
                  ? 'warning'
                  : ambulance.status === 'at-hospital'
                  ? 'success'
                  : 'outline'
              }
            >
              {ambulance.status}
            </Badge>
          </div>

          {/* ETA and Location */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-neutral-400" />
              <div>
                <p className="text-xs text-neutral-500">ETA</p>
                <p className="font-medium text-neutral-900 dark:text-white">
                  {getEtaDisplay(ambulance)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-neutral-400" />
              <div>
                <p className="text-xs text-neutral-500">Destination</p>
                <p className="font-medium text-neutral-900 dark:text-white truncate">
                  {ambulance.destinationHospitalId ? 'Apollo Hospital' : 'Not assigned'}
                </p>
              </div>
            </div>
          </div>

          {/* Patient Info (if available) */}
          {ambulance.patientName && (
            <div className="mb-3 p-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-neutral-400" />
                  <span className="text-sm font-medium text-neutral-900 dark:text-white">
                    {ambulance.patientName}
                  </span>
                </div>
                {ambulance.priority && (
                  <Badge variant={ambulance.priority <= 2 ? 'danger' : 'warning'} size="sm">
                    P{ambulance.priority}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-2">
            <Button
              size="sm"
              variant="secondary"
              fullWidth
              leftIcon={<Phone className="w-4 h-4" />}
              onClick={(e) => {
                e.stopPropagation();
                // Handle contact ambulance
              }}
            >
              Contact
            </Button>
            <Button
              size="sm"
              variant="primary"
              fullWidth
              leftIcon={<Building2 className="w-4 h-4" />}
              onClick={(e) => {
                e.stopPropagation();
                // Show hospital selection
              }}
            >
              Assign Hospital
            </Button>
          </div>

          {/* Live Progress Bar for ETA */}
          {ambulance.status === 'enroute' && ambulance.estimatedArrival && (
            <div className="mt-3">
              <div className="h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-medical-cyan transition-all duration-1000"
                  style={{ width: '60%' }} // Calculate based on progress
                />
              </div>
              <div className="flex justify-between mt-1 text-xs text-neutral-500">
                <span>Dispatch</span>
                <span>Arrival</span>
              </div>
            </div>
          )}
        </GlassCard>
      ))}
    </div>
  );
};