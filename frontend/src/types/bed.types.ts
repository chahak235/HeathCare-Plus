/**
 * Bed Management Types
 * Defines the complete type system for hospital bed tracking
 */

export type BedStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'reserved';
export type BedType = 'ICU' | 'General' | 'Emergency' | 'OperationTheater' | 'NICU' | 'CCU';
export type Priority = 1 | 2 | 3 | 4 | 5 | 6;

export interface Bed {
  id: string;
  bedNumber: string;
  ward: string;
  floor: number;
  type: BedType;
  specialty: string;
  status: BedStatus;
  equipment: string[];
  lastCleaned: string;
  isolationRequired: boolean;
  currentPatientId?: string;
  currentPatientName?: string;
  estimatedVacancy?: string;
  lastUpdated: string;
}

export interface BedUpdateEvent {
  bedId: string;
  status: BedStatus;
  patientId?: string;
  patientName?: string;
  timestamp: string;
}

export interface OccupancyMetrics {
  total: number;
  available: number;
  occupied: number;
  cleaning: number;
  maintenance: number;
  reserved: number;
  percentage: number;
}

export interface SpecialtyOccupancy {
  specialty: string;
  total: number;
  occupied: number;
  available: number;
  percentage: number;
  criticalCount?: number;
}

export interface TriagePatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  priority: Priority;
  symptoms: string[];
  vitals?: {
    heartRate: number;
    bloodPressure: string;
    oxygenSaturation: number;
    temperature: number;
  };
  ambulanceETA?: number;
  arrivalTime: string;
  assignedDoctorId?: string;
  status: 'waiting' | 'assigned' | 'in-treatment' | 'admitted' | 'discharged';
}

export interface DoctorStatus {
  id: string;
  name: string;
  specialty: string;
  isOnDuty: boolean;
  isEmergencyAvailable: boolean;
  currentPatients: number;
  maxPatients: number;
  nextAvailable?: string;
}

export interface Ambulance {
  id: string;
  vehicleNumber: string;
  type: 'basic' | 'advanced' | 'icu';
  status: 'available' | 'enroute' | 'at-hospital' | 'maintenance';
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  destinationHospitalId?: string;
  estimatedArrival?: string;
  patientId?: string;
  patientName?: string;
  priority?: Priority;
}