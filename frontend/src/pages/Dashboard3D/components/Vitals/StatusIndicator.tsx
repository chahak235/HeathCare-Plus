import React from 'react';
import { VitalsData } from '../../../../services/vitals.service';

interface StatusIndicatorProps {
  vitals: VitalsData | null;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ vitals }) => {
  if (!vitals) return null;

  const getOverallStatus = () => {
    const checks = [
      vitals.heartRate < 60 || vitals.heartRate > 100,
      vitals.oxygenSaturation < 95,
      vitals.temperature < 97 || vitals.temperature > 99,
      vitals.bloodPressureSystolic < 90 || vitals.bloodPressureSystolic > 130
    ];

    if (checks.some(check => check)) return 'warning';
    return 'stable';
  };

  const status = getOverallStatus();

  return (
    <div className={`px-4 py-2 rounded-full ${
      status === 'stable' ? 'bg-success-100 text-success-700' : 'bg-warning-100 text-warning-700'
    }`}>
      <span className="text-sm font-medium">
        {status === 'stable' ? '✅ Stable' : '⚠️ Needs Attention'}
      </span>
    </div>
  );
};
