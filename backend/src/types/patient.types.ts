/**
 * Patient State Machine Types
 * Defines the complete patient lifecycle
 */

export type PatientStatus = 
  | 'ARRIVED'
  | 'IN_TRIAGE'
  | 'TRIAGED'
  | 'AWAITING_BED'
  | 'BED_ASSIGNED'
  | 'IN_TRANSIT'
  | 'UNDER_TREATMENT'
  | 'AWAITING_DISCHARGE'
  | 'DISCHARGED'
  | 'TRANSFERRED'
  | 'DECEASED';

export type PatientGender = 'male' | 'female' | 'other' | 'unknown';

export interface Patient {
  id: string;
  hospitalId: string;
  mrn: string;
  name: string;
  age: number;
  gender: PatientGender;
  bloodGroup?: string;
  phone?: string;
  email?: string;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  
  // Medical
  allergies: string[];
  chronicConditions: string[];
  currentMedications: string[];
  medicalHistory?: string;
  
  // Status
  status: PatientStatus;
  priority?: 1 | 2 | 3 | 4 | 5 | 6;
  
  // Assigned resources
  currentBedId?: string;
  currentDoctorId?: string;
  currentNurseId?: string;
  
  // Timestamps
  arrivedAt: Date;
  triagedAt?: Date;
  bedAssignedAt?: Date;
  treatmentStartedAt?: Date;
  dischargedAt?: Date;
  updatedAt: Date;
  
  // Metadata
  tags?: string[];
}

export interface StatusTransition {
  id: string;
  patientId: string;
  fromStatus: PatientStatus;
  toStatus: PatientStatus;
  reason?: string;
  actorId: string;
  actorType: 'doctor' | 'nurse' | 'admin' | 'system';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface PatientJourney {
  patientId: string;
  patientName: string;
  currentStatus: PatientStatus;
  currentPriority?: number;
  waitingTime: number;
  estimatedTreatmentTime?: number;
  estimatedDischarge?: Date;
  timeline: {
    status: PatientStatus;
    timestamp: Date;
    duration?: number;
    actor?: string;
  }[];
}

export interface DischargeSummary {
  patientId: string;
  admittedAt: Date;
  dischargedAt: Date;
  lengthOfStay: number;
  admittingDiagnosis: string;
  dischargeDiagnosis: string;
  procedures: string[];
  medications: {
    name: string;
    dosage: string;
    duration: string;
  }[];
  followUpRequired: boolean;
  followUpDate?: Date;
  followUpSpecialty?: string;
  dischargeInstructions: string;
  doctorId: string;
  doctorName: string;
}

// This is a VALUE, not a type - so don't use 'export type'
export const ALLOWED_TRANSITIONS: Record<PatientStatus, PatientStatus[]> = {
  ARRIVED: ['IN_TRIAGE', 'DISCHARGED'],
  IN_TRIAGE: ['TRIAGED', 'DECEASED'],
  TRIAGED: ['AWAITING_BED', 'UNDER_TREATMENT', 'DISCHARGED'],
  AWAITING_BED: ['BED_ASSIGNED', 'TRANSFERRED', 'DECEASED'],
  BED_ASSIGNED: ['IN_TRANSIT', 'AWAITING_BED'],
  IN_TRANSIT: ['UNDER_TREATMENT', 'DECEASED'],
  UNDER_TREATMENT: ['AWAITING_DISCHARGE', 'DECEASED', 'TRANSFERRED'],
  AWAITING_DISCHARGE: ['DISCHARGED', 'UNDER_TREATMENT'],
  DISCHARGED: [],
  TRANSFERRED: [],
  DECEASED: []
};

export const STATUS_DISPLAY_NAMES: Record<PatientStatus, string> = {
  ARRIVED: 'Arrived',
  IN_TRIAGE: 'In Triage',
  TRIAGED: 'Triaged',
  AWAITING_BED: 'Awaiting Bed',
  BED_ASSIGNED: 'Bed Assigned',
  IN_TRANSIT: 'In Transit',
  UNDER_TREATMENT: 'Under Treatment',
  AWAITING_DISCHARGE: 'Awaiting Discharge',
  DISCHARGED: 'Discharged',
  TRANSFERRED: 'Transferred',
  DECEASED: 'Deceased'
};

export const STATUS_COLORS: Record<PatientStatus, string> = {
  ARRIVED: 'neutral',
  IN_TRIAGE: 'warning',
  TRIAGED: 'info',
  AWAITING_BED: 'warning',
  BED_ASSIGNED: 'info',
  IN_TRANSIT: 'info',
  UNDER_TREATMENT: 'primary',
  AWAITING_DISCHARGE: 'success',
  DISCHARGED: 'success',
  TRANSFERRED: 'neutral',
  DECEASED: 'danger'
};
