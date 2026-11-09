import React from 'react';
import { Link } from 'react-router-dom';
import { GlassCard } from '../../components/layout/GlassCard';
import { Button } from '../../components/ui/Button';
import { PriorityQueue } from '../../components/features/command-center/PriorityQueue';
import { Eye, MessageSquare, Calendar, FileText } from 'lucide-react';
import type { TriagePatient } from '../../types/bed.types';

interface TriageTabProps {
  patients: TriagePatient[];
  onAssignDoctor: (patientId: string, doctorId: string) => void;
  onViewPatientDetails: (patientId: string) => void;
}

export const TriageTab: React.FC<TriageTabProps> = ({
  patients,
  onAssignDoctor,
  onViewPatientDetails,
}) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-2">
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold font-heading text-neutral-900 dark:text-white">
            Emergency Triage Queue
          </h2>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" leftIcon={<FileText className="w-4 h-4" />}>
              Export
            </Button>
            <Button variant="primary" size="sm">
              Refresh
            </Button>
          </div>
        </div>
        <PriorityQueue
          patients={patients}
          onAssignDoctor={onAssignDoctor}
          onViewDetails={onViewPatientDetails}
        />
      </GlassCard>
    </div>

    <div className="lg:col-span-1 space-y-6">
      <GlassCard className="p-4">
        <h2 className="text-lg font-bold font-heading text-neutral-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="space-y-3">
          <Link to="/analysis">
            <Button fullWidth leftIcon={<Eye className="w-4 h-4" />}>
              New Image Analysis
            </Button>
          </Link>
          <Link to="/chat">
            <Button variant="secondary" fullWidth leftIcon={<MessageSquare className="w-4 h-4" />}>
              Start Consultation
            </Button>
          </Link>
          <Button variant="secondary" fullWidth leftIcon={<Calendar className="w-4 h-4" />}>
            Schedule Follow-up
          </Button>
          <Button variant="ghost" fullWidth leftIcon={<FileText className="w-4 h-4" />}>
            Generate Report
          </Button>
        </div>
      </GlassCard>

      <GlassCard className="p-4">
        <h2 className="text-lg font-bold font-heading text-neutral-900 dark:text-white mb-4">
          Triage Stats
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-neutral-600">P1 (Critical)</span>
            <span className="font-bold text-medical-red">
              {patients.filter((p) => p.priority === 1).length}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600">P2 (Emergency)</span>
            <span className="font-bold text-medical-orange">
              {patients.filter((p) => p.priority === 2).length}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600">P3 (Urgent)</span>
            <span className="font-bold text-medical-yellow">
              {patients.filter((p) => p.priority === 3).length}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600">Average Wait</span>
            <span className="font-bold text-neutral-900">12 min</span>
          </div>
        </div>
      </GlassCard>
    </div>
  </div>
);
