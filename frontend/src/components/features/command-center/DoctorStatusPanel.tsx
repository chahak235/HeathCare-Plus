/**
 * DoctorStatusPanel Component
 * Displays real-time doctor availability and workload
 */

import React, { useState } from 'react';
import {
  Stethoscope,
  Users,
  Clock,
  AlertCircle,
  Phone,
  Video,
  UserCheck,
  UserX,
} from 'lucide-react';
import type { DoctorStatus } from '../../../types/bed.types';
import { GlassCard } from '../../layout/GlassCard';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';

interface DoctorStatusPanelProps {
  doctors: DoctorStatus[];
  onCallDoctor: (doctorId: string) => void;
  onViewSchedule: (doctorId: string) => void;
}

export const DoctorStatusPanel: React.FC<DoctorStatusPanelProps> = ({
  doctors,
  onCallDoctor,
  onViewSchedule,
}) => {
  const [filter, setFilter] = useState<'all' | 'on-duty' | 'available' | 'emergency'>('all');

  const filteredDoctors = doctors.filter((doctor) => {
    switch (filter) {
      case 'on-duty':
        return doctor.isOnDuty;
      case 'available':
        return doctor.isOnDuty && doctor.currentPatients < doctor.maxPatients;
      case 'emergency':
        return doctor.isEmergencyAvailable;
      default:
        return true;
    }
  });

  const stats = {
    total: doctors.length,
    onDuty: doctors.filter((d) => d.isOnDuty).length,
    available: doctors.filter((d) => d.isOnDuty && d.currentPatients < d.maxPatients).length,
    emergency: doctors.filter((d) => d.isEmergencyAvailable).length,
  };

  return (
    <div className="space-y-4">
      {/* Stats Header */}
      <div className="grid grid-cols-4 gap-2">
        <div className="text-center p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800">
          <p className="text-xs text-neutral-500">Total</p>
          <p className="text-lg font-bold text-neutral-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-medical-cyan/10">
          <p className="text-xs text-medical-cyan">On Duty</p>
          <p className="text-lg font-bold text-medical-cyan">{stats.onDuty}</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-medical-green/10">
          <p className="text-xs text-medical-green">Available</p>
          <p className="text-lg font-bold text-medical-green">{stats.available}</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-medical-red/10">
          <p className="text-xs text-medical-red">Emergency</p>
          <p className="text-lg font-bold text-medical-red">{stats.emergency}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
        {(['all', 'on-duty', 'available', 'emergency'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === f
                ? 'bg-white dark:bg-neutral-700 text-medical-cyan shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            {f === 'all' && 'All'}
            {f === 'on-duty' && 'On Duty'}
            {f === 'available' && 'Available'}
            {f === 'emergency' && 'Emergency'}
          </button>
        ))}
      </div>

      {/* Doctor List */}
      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {filteredDoctors.map((doctor) => (
          <div
            key={doctor.id}
            className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-medical-cyan/10">
                  <Stethoscope className="w-4 h-4 text-medical-cyan" />
                </div>
                <div>
                  <h4 className="font-medium text-neutral-900 dark:text-white">
                    {doctor.name}
                  </h4>
                  <p className="text-xs text-neutral-500">{doctor.specialty}</p>
                </div>
              </div>
              <div className="flex gap-1">
                {doctor.isEmergencyAvailable && (
                  <Badge variant="danger" size="sm">Emergency</Badge>
                )}
                {doctor.isOnDuty ? (
                  <Badge variant="success" size="sm">On Duty</Badge>
                ) : (
                  <Badge variant="outline" size="sm">Off Duty</Badge>
                )}
              </div>
            </div>

            {/* Workload Bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-neutral-500">Current Patients</span>
                <span className="font-medium text-neutral-900 dark:text-white">
                  {doctor.currentPatients}/{doctor.maxPatients}
                </span>
              </div>
              <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    doctor.currentPatients === doctor.maxPatients
                      ? 'bg-medical-red'
                      : doctor.currentPatients > doctor.maxPatients / 2
                      ? 'bg-medical-orange'
                      : 'bg-medical-green'
                  }`}
                  style={{ width: `${(doctor.currentPatients / doctor.maxPatients) * 100}%` }}
                />
              </div>
            </div>

            {/* Next Available (if not on duty) */}
            {!doctor.isOnDuty && doctor.nextAvailable && (
              <div className="flex items-center gap-1 mb-3 text-xs text-neutral-500">
                <Clock className="w-3 h-3" />
                <span>Next available: {new Date(doctor.nextAvailable).toLocaleTimeString()}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                fullWidth
                leftIcon={<Phone className="w-4 h-4" />}
                onClick={() => onCallDoctor(doctor.id)}
                disabled={!doctor.isOnDuty}
              >
                Call
              </Button>
              <Button
                size="sm"
                variant="ghost"
                fullWidth
                leftIcon={<Clock className="w-4 h-4" />}
                onClick={() => onViewSchedule(doctor.id)}
              >
                Schedule
              </Button>
            </div>
          </div>
        ))}

        {filteredDoctors.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
            <p className="text-neutral-500">No doctors match the filter</p>
          </div>
        )}
      </div>
    </div>
  );
};