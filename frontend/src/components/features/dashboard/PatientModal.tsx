import React from 'react';
import { X, User, Calendar, Phone, Mail, MapPin, Activity } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { ProgressRing } from '../../ui/ProgressRing';

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: {
    id: string;
    name: string;
    age: number;
    gender: string;
    lastVisit: string;
    condition: string;
    status: 'stable' | 'improving' | 'critical';
  };
}

export const PatientModal: React.FC<PatientModalProps> = ({
  isOpen,
  onClose,
  patient,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-w-2xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mr-4">
                <User className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {patient.name}
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Patient ID: {patient.id}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Patient Info */}
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                  Personal Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-neutral-400 mr-3" />
                    <span className="text-neutral-600 dark:text-neutral-400">
                      {patient.age} years old • {patient.gender}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 text-neutral-400 mr-3" />
                    <span className="text-neutral-600 dark:text-neutral-400">
                      +1 (555) 123-4567
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-neutral-400 mr-3" />
                    <span className="text-neutral-600 dark:text-neutral-400">
                      patient@example.com
                    </span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 text-neutral-400 mr-3" />
                    <span className="text-neutral-600 dark:text-neutral-400">
                      123 Medical St, Boston, MA
                    </span>
                  </div>
                </div>
              </div>

              {/* Health Stats */}
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                  Health Metrics
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">
                      Condition
                    </span>
                    <Badge
                      variant={
                        patient.status === 'stable'
                          ? 'success'
                          : patient.status === 'improving'
                          ? 'warning'
                          : 'error'
                      }
                    >
                      {patient.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">
                      Last Visit
                    </span>
                    <span className="font-medium">{patient.lastVisit}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">
                      Primary Condition
                    </span>
                    <span className="font-medium">{patient.condition}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Rings */}
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="text-center">
                <ProgressRing percentage={85} size="md" label="Recovery Progress" />
              </div>
              <div className="text-center">
                <ProgressRing percentage={92} size="md" label="Medication Adherence" />
              </div>
              <div className="text-center">
                <ProgressRing percentage={78} size="md" label="Follow-up Rate" />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button fullWidth leftIcon={<Activity className="w-4 h-4" />}>
                View Full History
              </Button>
              <Button variant="secondary" fullWidth>
                Schedule Follow-up
              </Button>
              <Button variant="ghost" fullWidth>
                Export Records
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};