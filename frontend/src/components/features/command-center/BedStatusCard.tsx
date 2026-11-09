/**
 * BedStatusCard Component
 * Individual bed display with status and patient info
 * Used in LiveBedBoard for grid view
 */

import React from 'react';
import {
  Activity,
  Droplets,
  Wind,
  Heart,
  AlertCircle,
  Clock,
  User,
  Syringe,
  Wrench,
} from 'lucide-react';
import type { Bed } from '../../../types/bed.types';
import { Badge } from '../../ui/Badge';

interface BedStatusCardProps {
  bed: Bed;
  onClick?: (bed: Bed) => void;
}

export const BedStatusCard: React.FC<BedStatusCardProps> = ({ bed, onClick }) => {
  const getStatusConfig = () => {
    switch (bed.status) {
      case 'available':
        return {
          color: 'text-medical-green',
          bgColor: 'bg-medical-green/10',
          borderColor: 'border-medical-green/20',
          label: 'Available',
          icon: Activity,
        };
      case 'occupied':
        return {
          color: 'text-medical-red',
          bgColor: 'bg-medical-red/10',
          borderColor: 'border-medical-red/20',
          label: 'Occupied',
          icon: Heart,
        };
      case 'cleaning':
        return {
          color: 'text-medical-yellow',
          bgColor: 'bg-medical-yellow/10',
          borderColor: 'border-medical-yellow/20',
          label: 'Cleaning',
          icon: Droplets,
        };
      case 'maintenance':
        return {
          color: 'text-neutral-500',
          bgColor: 'bg-neutral-100 dark:bg-neutral-800',
          borderColor: 'border-neutral-200 dark:border-neutral-700',
          label: 'Maintenance',
          icon: Wrench,
        };
      case 'reserved':
        return {
          color: 'text-medical-orange',
          bgColor: 'bg-medical-orange/10',
          borderColor: 'border-medical-orange/20',
          label: 'Reserved',
          icon: Clock,
        };
      default:
        return {
          color: 'text-neutral-400',
          bgColor: 'bg-neutral-100 dark:bg-neutral-800',
          borderColor: 'border-neutral-200 dark:border-neutral-700',
          label: bed.status,
          icon: Activity,
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  const getEquipmentIcons = (equipment: string[]) => {
    const icons = [];
    if (equipment.includes('ventilator')) icons.push(<Wind key="vent" className="w-3.5 h-3.5" />);
    if (equipment.includes('monitor')) icons.push(<Activity key="mon" className="w-3.5 h-3.5" />);
    if (equipment.includes('defibrillator')) icons.push(<Heart key="defib" className="w-3.5 h-3.5" />);
    if (equipment.includes('infusion-pump')) icons.push(<Syringe key="inf" className="w-3.5 h-3.5" />);
    return icons;
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHrs < 0) return 'Overdue';
    if (diffHrs < 1) {
      const diffMin = Math.floor(diffMs / (1000 * 60));
      return `in ${diffMin} min`;
    }
    if (diffHrs < 24) return `in ${diffHrs} hr${diffHrs > 1 ? 's' : ''}`;
    return date.toLocaleDateString();
  };

  return (
    <div
      onClick={() => onClick?.(bed)}
      className={`group relative p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${config.borderColor} ${
        bed.status === 'available'
          ? 'hover:border-medical-green'
          : bed.status === 'occupied'
          ? 'hover:border-medical-red'
          : 'hover:border-medical-cyan'
      }`}
    >
      {/* Bed Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-neutral-900 dark:text-white">
              {bed.bedNumber}
            </span>
            <Badge variant="outline" size="sm">
              {bed.type}
            </Badge>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            {bed.ward} • Floor {bed.floor}
          </p>
        </div>
        <div className={`p-2 rounded-lg ${config.bgColor}`}>
          <StatusIcon className={`w-4 h-4 ${config.color}`} />
        </div>
      </div>

      {/* Patient Info (if occupied) */}
      {bed.currentPatientName && (
        <div className="mb-3 p-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-sm font-medium text-neutral-900 dark:text-white truncate">
              {bed.currentPatientName}
            </span>
          </div>
          {bed.estimatedVacancy && (
            <div className="flex items-center gap-1 mt-1 text-xs text-neutral-500">
              <Clock className="w-3 h-3" />
              <span>Vacant {formatTime(bed.estimatedVacancy)}</span>
            </div>
          )}
        </div>
      )}

      {/* Equipment Icons */}
      {bed.equipment.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          {getEquipmentIcons(bed.equipment).map((icon, i) => (
            <div
              key={i}
              className="p-1 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
              title={bed.equipment[i]}
            >
              {icon}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-neutral-400" />
          <span className="text-neutral-500">
            {new Date(bed.lastUpdated).toLocaleTimeString()}
          </span>
        </div>
        {bed.isolationRequired && (
          <Badge variant="warning" size="sm">
            Isolation
          </Badge>
        )}
      </div>

      {/* Status Indicator Dot */}
      <div
        className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
          bed.status === 'available'
            ? 'bg-medical-green'
            : bed.status === 'occupied'
            ? 'bg-medical-red'
            : bed.status === 'cleaning'
            ? 'bg-medical-yellow'
            : bed.status === 'reserved'
            ? 'bg-medical-orange'
            : 'bg-neutral-400'
        }`}
      />
    </div>
  );
};