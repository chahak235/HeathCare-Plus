/**
 * OccupancyMetrics Component
 * Displays occupancy statistics with progress bars and filters
 */

import React from 'react';
import { Activity, BedDouble, AlertCircle, CheckCircle2, Clock, Wrench } from 'lucide-react';
import type { OccupancyMetrics as OccupancyMetricsType, SpecialtyOccupancy } from '../../../types/bed.types';
import { GlassCard } from '../../layout/GlassCard';
import { Badge } from '../../ui/Badge';

interface OccupancyMetricsProps {
  metrics: OccupancyMetricsType;
  bySpecialty: SpecialtyOccupancy[];
  onFilter: (specialty: string | null) => void;
}

export const OccupancyMetrics: React.FC<OccupancyMetricsProps> = ({
  metrics,
  bySpecialty,
  onFilter,
}) => {
  const stats = [
    {
      label: 'Available Beds',
      value: metrics.available,
      icon: BedDouble,
      color: 'text-medical-green',
      bgColor: 'bg-medical-green/10',
      trend: `${metrics.percentage}% occupied`,
    },
    {
      label: 'Occupied',
      value: metrics.occupied,
      icon: Activity,
      color: 'text-medical-cyan',
      bgColor: 'bg-medical-cyan/10',
      trend: `${Math.round((metrics.occupied / metrics.total) * 100)}% of total`,
    },
    {
      label: 'Cleaning',
      value: metrics.cleaning,
      icon: Clock,
      color: 'text-medical-yellow',
      bgColor: 'bg-medical-yellow/10',
      trend: 'In progress',
    },
    {
      label: 'Maintenance',
      value: metrics.maintenance,
      icon: Wrench,
      color: 'text-neutral-500',
      bgColor: 'bg-neutral-100 dark:bg-neutral-800',
      trend: 'Out of service',
    },
    {
      label: 'Reserved',
      value: metrics.reserved,
      icon: AlertCircle,
      color: 'text-medical-orange',
      bgColor: 'bg-medical-orange/10',
      trend: 'Pending arrival',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-700"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {stat.label}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {stat.value}
                </span>
                <span className="text-xs text-neutral-500">{stat.trend}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall Occupancy Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-neutral-700 dark:text-neutral-300">
            Overall Occupancy
          </span>
          <span className="text-neutral-900 dark:text-white font-bold">
            {metrics.percentage}%
          </span>
        </div>
        <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-medical-cyan transition-all duration-500"
            style={{ width: `${metrics.percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-neutral-500">
          <span>{metrics.available} available</span>
          <span>{metrics.occupied} occupied</span>
        </div>
      </div>

      {/* Specialty Breakdown */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
          By Specialty
        </h3>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
          {bySpecialty.map((specialty) => (
            <button
              key={specialty.specialty}
              onClick={() => onFilter(specialty.specialty)}
              className="w-full group"
            >
              <div className="flex items-center justify-between text-sm mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-700 dark:text-neutral-300 group-hover:text-medical-cyan transition-colors">
                    {specialty.specialty}
                  </span>
                  {specialty.criticalCount && specialty.criticalCount > 0 && (
                    <Badge variant="danger" size="sm">
                      {specialty.criticalCount} critical
                    </Badge>
                  )}
                </div>
                <span className="text-neutral-900 dark:text-white font-medium">
                  {specialty.occupied}/{specialty.total}
                </span>
              </div>
              <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    specialty.percentage > 80
                      ? 'bg-medical-red'
                      : specialty.percentage > 60
                      ? 'bg-medical-orange'
                      : 'bg-medical-green'
                  }`}
                  style={{ width: `${specialty.percentage}%` }}
                />
              </div>
            </button>
          ))}
        </div>
        <button
          onClick={() => onFilter(null)}
          className="text-xs text-medical-cyan hover:text-medical-cyan/80 transition-colors mt-2"
        >
          Clear filter
        </button>
      </div>
    </div>
  );
};