/**
 * Bed Allocation Types
 * Defines the interfaces for the allocation engine
 */

export type Priority = 1 | 2 | 3 | 4 | 5 | 6;
export type BedType = 'ICU' | 'General' | 'Emergency' | 'OperationTheater' | 'NICU' | 'CCU';
export type BedStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'reserved';
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

export interface Bed {
  id: string;
  hospitalId: string;
  bedNumber: string;
  specialty: string;           // e.g., 'Cardiology', 'Neurology'
  type: BedType;
  ward: string;
  floor: number;
  status: BedStatus;
  equipment: string[];          // ['ventilator', 'monitor', 'defibrillator']
  isolationRequired: boolean;
  currentPatientId?: string;
  estimatedVacancy?: Date;
  lastCleaned: Date;
  isFemaleOnly?: boolean;
  isPediatric?: boolean;
  tags?: string[];              // ['isolation', 'bariatric', 'negative-pressure']
}

export interface AdmissionRequirements {
  patientId: string;
  priority: Priority;
  specialty: string;            // primary specialty needed
  requiresIcu: boolean;
  requiresVentilator: boolean;
  requiresIsolation: boolean;
  requiresNegativePressure?: boolean;
  isPediatric?: boolean;
  gender?: 'male' | 'female' | 'other';
  age?: number;
  preferredFloor?: number;
  preferredWard?: string;
  contraindications?: string[];  // equipment/specialties to avoid
}

export interface AllocationResult {
  success: boolean;
  bed?: Bed;
  score?: number;                // match quality (0-100)
  alternatives?: Bed[];          // other viable options
  reason?: string;               // why no bed found
  suggestedAction?: 'wait' | 'transfer' | 'downgrade' | 'upgrade';
}

export interface BedReservation {
  bedId: string;
  patientId: string;
  doctorId: string;
  reservedAt: Date;
  expiresAt: Date;               // reservation timeout (15-30 mins)
  estimatedDuration?: number;    // expected treatment duration in hours
}

export interface AllocationMetrics {
  totalBeds: number;
  availableBeds: number;
  occupancyRate: number;
  avgAllocationTime: number;     // in minutes
  bottlenecks: {
    specialty: string;
    waitCount: number;
    avgWaitTime: number;
  }[];
}