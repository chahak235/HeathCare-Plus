export type AlertPriority = 'low' | 'medium' | 'high' | 'emergency';
export type AlertStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'acknowledged';
export type AlertType = 
  | 'new_appointment'
  | 'emergency_triage'
  | 'bed_request'
  | 'doctor_assignment'
  | 'patient_arrival'
  | 'critical_vitals'
  | 'ambulance_dispatch';

export interface PatientAlert {
  id: string;
  patientId: number;
  patientName: string;
  type: AlertType;
  priority: AlertPriority;
  message: string;
  details: {
    symptoms?: string[];
    priority?: number;
    requiredSpecialty?: string;
    bedType?: string;
    estimatedArrival?: Date;
    location?: string;
    doctorId?: number;
    doctorName?: string;
    vitals?: any;           // ✅ ADD THIS
    scheduledTime?: Date;   // ✅ ADD THIS
  };
  targetRoles: ('doctor' | 'admin' | 'nurse' | 'all')[];
  targetSpecialties?: string[];
  status: AlertStatus;
  acknowledgedBy: {
    userId: string;
    userName: string;
    role: string;
    timestamp: Date;
  }[];
  createdAt: Date;
  expiresAt?: Date;
}

export interface AlertAcknowledgement {
  alertId: string;
  userId: string;
  userName: string;
  role: string;
  timestamp: Date;
  action?: 'accept' | 'reject' | 'delegate';
}
