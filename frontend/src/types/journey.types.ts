/**
 * Patient Journey Types
 * Tracks the complete patient lifecycle from arrival to discharge
 */

export type JourneyStepStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';
export type JourneyStepType = 
  | 'ambulance-dispatch'
  | 'arrival'
  | 'triage'
  | 'doctor-assignment'
  | 'bed-allocation'
  | 'treatment'
  | 'surgery'
  | 'pharmacy'
  | 'discharge'
  | 'follow-up';

export interface JourneyStep {
  id: string;
  patientId: string;
  type: JourneyStepType;
  title: string;
  description: string;
  status: JourneyStepStatus;
  timestamp: string;
  completedAt?: string;
  estimatedDuration?: number; // in minutes
  actualDuration?: number;
  actorId?: string; // doctor/nurse/paramedic ID
  actorName?: string;
  metadata?: Record<string, any>;
}

export interface PatientJourney {
  patientId: string;
  patientName: string;
  currentStep: string;
  startTime: string;
  estimatedDischarge?: string;
  actualDischarge?: string;
  steps: JourneyStep[];
  milestones: {
    triageCompleted?: string;
    doctorAssigned?: string;
    bedAllocated?: string;
    treatmentStarted?: string;
    treatmentCompleted?: string;
  };
}

export interface JourneyStats {
  averageTriageTime: number; // in minutes
  averageBedAllocationTime: number;
  averageDoctorResponseTime: number;
  averageTreatmentTime: number;
  averageLengthOfStay: number; // in hours
  bottlenecks: {
    step: string;
    averageDelay: number;
    occurrences: number;
  }[];
}