export type DashboardTab = 
  | 'overview' 
  | 'beds' 
  | 'triage' 
  | 'ambulances' 
  | 'doctors' 
  | 'analytics'
  | 'appointments'
  | 'trust';

export interface EmergencyStats {
  p1Patients: number;
  incomingAmbulances: number;
  availableEmergencyBeds: number;
  criticalDoctors: number;
}