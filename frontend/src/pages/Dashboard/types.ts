export type DashboardTab = 
  | 'overview' 
  | 'beds' 
  | 'triage' 
  | 'ambulances' 
  | 'doctors' 
  | 'analytics'; // Add this line

export interface EmergencyStats {
  p1Patients: number;
  incomingAmbulances: number;
  availableEmergencyBeds: number;
  criticalDoctors: number;
}