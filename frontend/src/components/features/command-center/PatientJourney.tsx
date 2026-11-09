/**
 * PatientJourney Component
 * Visual timeline of patient's hospital journey with real-time updates
 */

import React, { useState } from 'react';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Truck,
  Building2,
  Stethoscope,
  BedDouble,
  Pill,
  Syringe,
  Home,
  ChevronRight,
  Activity,
  Heart,
  XCircle,
  User,
  Phone,
  MapPin,
  Calendar,
  Download,
} from 'lucide-react';
import type { JourneyStep } from '../../../types/journey.types';
import { GlassCard } from '../../layout/GlassCard';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';

interface PatientJourneyProps {
  patientId: string;
  patientName: string;
  steps: JourneyStep[];
  currentStep: string;
  onStepClick?: (stepId: string) => void;
  onRefresh?: () => void;
}

export const PatientJourney: React.FC<PatientJourneyProps> = ({
  patientId,
  patientName,
  steps,
  currentStep,
  onStepClick,
  onRefresh,
}) => {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const getStepIcon = (type: JourneyStep['type']) => {
    switch (type) {
      case 'ambulance-dispatch':
        return Truck;
      case 'arrival':
        return Building2;
      case 'triage':
        return AlertCircle;
      case 'doctor-assignment':
        return Stethoscope;
      case 'bed-allocation':
        return BedDouble;
      case 'treatment':
        return Activity;
      case 'surgery':
        return Syringe;
      case 'pharmacy':
        return Pill;
      case 'discharge':
        return Home;
      case 'follow-up':
        return Calendar;
      default:
        return Clock;
    }
  };

  const getStepColor = (status: JourneyStep['status'], type: JourneyStep['type']) => {
    if (status === 'completed') {
      return {
        bg: 'bg-medical-green/10',
        border: 'border-medical-green',
        text: 'text-medical-green',
        icon: 'text-medical-green',
      };
    }
    if (status === 'in-progress') {
      return {
        bg: 'bg-medical-cyan/10',
        border: 'border-medical-cyan',
        text: 'text-medical-cyan',
        icon: 'text-medical-cyan',
      };
    }
    if (status === 'cancelled') {
      return {
        bg: 'bg-medical-red/10',
        border: 'border-medical-red',
        text: 'text-medical-red',
        icon: 'text-medical-red',
      };
    }
    return {
      bg: 'bg-neutral-100 dark:bg-neutral-800',
      border: 'border-neutral-200 dark:border-neutral-700',
      text: 'text-neutral-400',
      icon: 'text-neutral-400',
    };
  };

  const getStatusBadge = (status: JourneyStep['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'in-progress':
        return <Badge variant="info">In Progress</Badge>;
      case 'cancelled':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const sortedSteps = [...steps].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <div className="space-y-4">
      {/* Patient Header */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-medical-cyan/10 rounded-lg">
              <User className="w-5 h-5 text-medical-cyan" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 dark:text-white">{patientName}</h3>
              <p className="text-sm text-neutral-500">ID: {patientId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" leftIcon={<Download className="w-4 h-4" />}>
              Export
            </Button>
            {onRefresh && (
              <Button variant="ghost" size="sm" onClick={onRefresh}>
                Refresh
              </Button>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Timeline */}
      <GlassCard className="p-6">
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-neutral-200 dark:bg-neutral-700" />

          {/* Steps */}
          <div className="space-y-6">
            {sortedSteps.map((step, index) => {
              const Icon = getStepIcon(step.type);
              const colors = getStepColor(step.status, step.type);
              const isExpanded = expandedStep === step.id;
              const isCurrent = step.id === currentStep;

              return (
                <div
                  key={step.id}
                  className={`relative transition-all ${
                    onStepClick ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => {
                    if (onStepClick) {
                      onStepClick(step.id);
                    }
                    setExpandedStep(isExpanded ? null : step.id);
                  }}
                >
                  {/* Timeline Node */}
                  <div className="absolute left-0 top-0 flex items-center justify-center">
                    <div
                      className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                        colors.border
                      } ${colors.bg} ${
                        isCurrent ? 'ring-2 ring-medical-cyan ring-offset-2' : ''
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${colors.icon}`} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="ml-16 pb-6">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-neutral-900 dark:text-white">
                            {step.title}
                          </h4>
                          {getStatusBadge(step.status)}
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          {step.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-neutral-500">
                          {new Date(step.timestamp).toLocaleTimeString()}
                        </div>
                        {step.estimatedDuration && (
                          <div className="text-xs text-neutral-400 mt-1">
                            Est: {formatDuration(step.estimatedDuration)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && step.metadata && (
                      <div className="mt-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg space-y-2">
                        {Object.entries(step.metadata).map(([key, value]) => (
                          <div key={key} className="flex items-start gap-2 text-sm">
                            <span className="font-medium text-neutral-700 dark:text-neutral-300 min-w-[100px]">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                            </span>
                            <span className="text-neutral-600 dark:text-neutral-400">
                              {Array.isArray(value) ? value.join(', ') : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actor Info */}
                    {step.actorName && (
                      <div className="flex items-center gap-2 mt-2 text-sm">
                        <User className="w-4 h-4 text-neutral-400" />
                        <span className="text-neutral-600 dark:text-neutral-400">
                          {step.actorName}
                        </span>
                      </div>
                    )}

                    {/* Duration Comparison */}
                    {step.actualDuration && step.estimatedDuration && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              step.actualDuration <= step.estimatedDuration
                                ? 'bg-medical-green'
                                : 'bg-medical-orange'
                            }`}
                            style={{
                              width: `${Math.min(
                                (step.actualDuration / step.estimatedDuration) * 100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-neutral-500">
                          {formatDuration(step.actualDuration)} actual
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </GlassCard>
    </div>
  );
};