import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface EmergencyAlertBannerProps {
  p1Count: number;
  incomingAmbulances: number;
  availableErBeds: number;
  criticalDoctors: number;
  onDismiss: () => void;
}

export const EmergencyAlertBanner: React.FC<EmergencyAlertBannerProps> = ({
  p1Count,
  incomingAmbulances,
  availableErBeds,
  criticalDoctors,
  onDismiss
}) => {
  if (p1Count === 0) return null;

  return (
    <div className="mb-6 p-4 bg-medical-red/10 border border-medical-red/20 rounded-lg animate-pulse-slow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-medical-red rounded-full">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-medical-red">
              Emergency Alert: {p1Count} Priority 1 Patient{p1Count > 1 ? 's' : ''} Waiting
            </h3>
            <p className="text-sm text-medical-red/80">
              {incomingAmbulances} ambulances incoming • {availableErBeds} emergency beds available • {criticalDoctors} critical care doctors on duty
            </p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-medical-red/60 hover:text-medical-red"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
