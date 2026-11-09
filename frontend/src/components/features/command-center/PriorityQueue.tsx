/**
 * PriorityQueue Component
 * Displays triage patients by priority level (P1-P6)
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  Heart,
  Activity,
  User,
  Clock,
  ChevronRight,
  Truck as AmbulanceIcon,
} from 'lucide-react';
import type { TriagePatient } from '../../../types/bed.types';
import { GlassCard } from '../../layout/GlassCard';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { PatientDetailsModal } from './PatientDetailsModal';

interface PriorityQueueProps {
  patients: TriagePatient[];
  onAssignDoctor: (patientId: string, doctorId: string) => void;
  onViewDetails: (patientId: string) => void;
}

export const PriorityQueue: React.FC<PriorityQueueProps> = ({
  patients,
  onAssignDoctor,
  onViewDetails,
}) => {
  const [expandedPriority, setExpandedPriority] = useState<number | null>(1);
  const [selectedPatient, setSelectedPatient] = useState<TriagePatient | null>(null);

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return {
          bg: 'bg-medical-red',
          text: 'text-white',
          badge: 'danger',
          icon: AlertTriangle,
        };
      case 2:
        return {
          bg: 'bg-medical-orange',
          text: 'text-white',
          badge: 'warning',
          icon: AlertTriangle,
        };
      case 3:
        return {
          bg: 'bg-medical-yellow',
          text: 'text-neutral-900',
          badge: 'warning',
          icon: Activity,
        };
      case 4:
        return {
          bg: 'bg-medical-cyan',
          text: 'text-white',
          badge: 'info',
          icon: Clock,
        };
      case 5:
        return {
          bg: 'bg-medical-green',
          text: 'text-white',
          badge: 'success',
          icon: User,
        };
      default:
        return {
          bg: 'bg-neutral-400',
          text: 'text-white',
          badge: 'outline',
          icon: User,
        };
    }
  };

  const patientsByPriority = patients.reduce((acc, patient) => {
    const priority = patient.priority;
    if (!acc[priority]) acc[priority] = [];
    acc[priority].push(patient);
    return acc;
  }, {} as Record<number, TriagePatient[]>);

  const sortedPriorities = [1, 2, 3, 4, 5, 6].filter((p) => patientsByPriority[p]?.length > 0);

  const openPatientModal = (patient: TriagePatient, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedPatient(patient);
    onViewDetails(patient.id);
  };

  return (
    <>
      <div className="space-y-4">
        {sortedPriorities.map((priority) => {
          const priorityPatients = patientsByPriority[priority];
          const priorityConfig = getPriorityColor(priority);
          const PriorityIcon = priorityConfig.icon;
          const isExpanded = expandedPriority === priority;

          return (
            <GlassCard key={priority} className="overflow-hidden">
              {/* Priority Header */}
              <div
                onClick={() => setExpandedPriority(isExpanded ? null : priority)}
                className={`p-4 cursor-pointer transition-colors ${priorityConfig.bg} bg-opacity-10 hover:bg-opacity-20`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${priorityConfig.bg} bg-opacity-20`}>
                      <PriorityIcon className={`w-5 h-5 ${priorityConfig.text}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-neutral-900 dark:text-white">
                          Priority {priority}
                        </h3>
                        <Badge variant={priorityConfig.badge as 'danger' | 'warning' | 'info' | 'success' | 'outline'}>
                          {priorityPatients.length} patient{priorityPatients.length > 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {priority === 1 && 'Immediate - Cardiac Arrest / Stroke'}
                        {priority === 2 && 'Severe - <5 min response'}
                        {priority === 3 && 'Urgent - <15 min response'}
                        {priority === 4 && 'Standard - <30 min response'}
                        {priority === 5 && 'Non-urgent - <60 min response'}
                        {priority === 6 && 'Consultation - Flexible'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-5 h-5 text-neutral-400 transition-transform ${
                      isExpanded ? 'rotate-90' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Priority Patients List */}
              {isExpanded && (
                <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {priorityPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-neutral-900 dark:text-white">
                            {patient.name}
                          </h4>
                          <p className="text-sm text-neutral-500">
                            {patient.age} yrs • {patient.gender}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={patient.status === 'waiting' ? 'warning' : 'info'}>
                            {patient.status}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => openPatientModal(patient, e)}
                          >
                            View
                          </Button>
                        </div>
                      </div>

                      {/* Symptoms */}
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                          {patient.symptoms.map((symptom, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 text-xs rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                            >
                              {symptom}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Vitals (if available) */}
                      {patient.vitals && (
                        <div className="grid grid-cols-4 gap-2 mb-3">
                          <div className="text-center p-2 rounded bg-neutral-50 dark:bg-neutral-800">
                            <p className="text-xs text-neutral-500">HR</p>
                            <p className="font-medium text-neutral-900 dark:text-white">
                              {patient.vitals.heartRate}
                            </p>
                          </div>
                          <div className="text-center p-2 rounded bg-neutral-50 dark:bg-neutral-800">
                            <p className="text-xs text-neutral-500">BP</p>
                            <p className="font-medium text-neutral-900 dark:text-white">
                              {patient.vitals.bloodPressure}
                            </p>
                          </div>
                          <div className="text-center p-2 rounded bg-neutral-50 dark:bg-neutral-800">
                            <p className="text-xs text-neutral-500">SpO2</p>
                            <p className="font-medium text-neutral-900 dark:text-white">
                              {patient.vitals.oxygenSaturation}%
                            </p>
                          </div>
                          <div className="text-center p-2 rounded bg-neutral-50 dark:bg-neutral-800">
                            <p className="text-xs text-neutral-500">Temp</p>
                            <p className="font-medium text-neutral-900 dark:text-white">
                              {patient.vitals.temperature}°F
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Ambulance ETA or Arrival Time */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          {patient.ambulanceETA ? (
                            <div className="flex items-center gap-1 text-medical-orange">
                              <AmbulanceIcon className="w-4 h-4" />
                              <span>ETA: {patient.ambulanceETA} min</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-neutral-500">
                              <Clock className="w-4 h-4" />
                              <span>Arrived {new Date(patient.arrivalTime).toLocaleTimeString()}</span>
                            </div>
                          )}
                        </div>
                        {!patient.assignedDoctorId && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={(e) => openPatientModal(patient, e)}
                          >
                            Assign Doctor
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>

      {selectedPatient && (
        <PatientDetailsModal
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
          onAssignBed={(patientId) => {
            console.log('Assign bed to', patientId);
            setSelectedPatient(null);
          }}
          onAssignDoctor={(patientId) => {
            onAssignDoctor(patientId, '');
            setSelectedPatient(null);
          }}
          onStartConsultation={(patientId) => {
            console.log('Start consultation for', patientId);
            setSelectedPatient(null);
          }}
        />
      )}
    </>
  );
};
