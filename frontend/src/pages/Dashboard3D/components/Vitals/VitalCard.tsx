import React from 'react';
import { LucideIcon } from 'lucide-react';

interface VitalCardProps {
  icon: LucideIcon;
  label: string;
  value?: number | string;
  unit?: string;
  status: 'normal' | 'warning' | 'critical';
  thresholds?: { min: number; max: number };
}

export const VitalCard: React.FC<VitalCardProps> = ({
  icon: Icon,
  label,
  value,
  unit,
  status,
  thresholds
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'critical': return 'bg-critical-500';
      case 'warning': return 'bg-warning-500';
      default: return 'bg-success-500';
    }
  };

  const getStatusBg = () => {
    switch (status) {
      case 'critical': return 'bg-critical-100';
      case 'warning': return 'bg-warning-100';
      default: return 'bg-success-100';
    }
  };

  return (
    <div className={`${getStatusBg()} rounded-2xl p-4 border border-white/40 shadow-lg`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
          <Icon className="w-5 h-5 text-primary-700" />
          <span className="text-sm font-medium text-primary-800">{label}</span>
        </div>
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <span className="text-2xl font-bold text-primary-900">
            {value !== undefined ? value : '--'}
          </span>
          {unit && <span className="text-sm text-primary-600 ml-1">{unit}</span>}
        </div>
        
        {thresholds && value !== undefined && typeof value === 'number' && (
          <div className="text-xs text-primary-600">
            {value < thresholds.min ? 'Low' : value > thresholds.max ? 'High' : 'Normal'}
          </div>
        )}
      </div>
    </div>
  );
};
