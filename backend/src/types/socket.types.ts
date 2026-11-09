export type SocketEvent = 
  | 'bed:update'
  | 'bed:allocate'
  | 'patient:arrive'
  | 'patient:transition'
  | 'ambulance:dispatch'
  | 'ambulance:location'
  | 'doctor:status'
  | 'doctor:assign'
  | 'alert:emergency'
  | 'alert:critical'
  | 'notification:new';

export interface BedUpdateData {
  bedId: string;
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'reserved';
  patientId?: string;
  patientName?: string;
  estimatedVacancy?: Date;
  updatedAt: Date;
}

export interface PatientTransitionData {
  patientId: string;
  patientName: string;
  fromStatus: string;
  toStatus: string;
  priority?: number;
  timestamp: Date;
}

export interface AmbulanceLocationData {
  ambulanceId: string;
  vehicleNumber: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  eta?: number; // minutes to destination
  destinationHospital?: string;
  patientPriority?: number;
}

export interface DoctorStatusData {
  doctorId: string;
  name: string;
  isOnDuty: boolean;
  isEmergencyAvailable: boolean;
  currentPatients: number;
  maxPatients: number;
  updatedAt: Date;
}

export interface EmergencyAlertData {
  alertId: string;
  type: 'P1' | 'P2' | 'CODE_BLUE' | 'CODE_RED';
  patientId?: string;
  patientName?: string;
  location: string;
  message: string;
  requiredSpecialty?: string;
  timestamp: Date;
  acknowledgedBy?: string[];
}

export interface SocketRoom {
  userId: string;
  userType: 'doctor' | 'nurse' | 'admin' | 'paramedic';
  rooms: string[];
}
