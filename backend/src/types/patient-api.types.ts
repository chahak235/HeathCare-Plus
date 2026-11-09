export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: string;
  phoneNumber?: string;
  email?: string;
  hospitalId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  mrn: string;
}

export interface CreatePatientDto {
  firstName: string;
  lastName: string;
  dateOfBirth: Date | string;
  gender: string;
  phoneNumber?: string;
  email?: string;
  hospitalId: string;
}

export interface UpdatePatientDto {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date | string;
  gender?: string;
  phoneNumber?: string;
  email?: string;
}

export interface PatientFilterOptions {
  status?: string;
  priority?: number;
  search?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
  isActive?: boolean;
}

export interface PatientListResponse {
  patients: Patient[];
  total: number;
  limit: number;
  offset: number;
}

export interface PatientStatsResponse {
  totalPatients: number;
  byStatus: Record<string, number>;
  byPriority: {
    p1: number;
    p2: number;
    p3: number;
    p4: number;
    p5: number;
  };
  averageWaitTime: number;
  averageLengthOfStay: number;
  currentWaiting: number;
  admittedToday: number;
  dischargedToday: number;
}

export type PatientStatus = string;
export interface PatientWorkflowState {
  patientId: string;
  status: string;
  priority?: number;
  currentBedId?: string;
  currentDoctorId?: string;
  currentNurseId?: string;
  triagedAt?: Date;
  bedAssignedAt?: Date;
  treatmentStartedAt?: Date;
  dischargedAt?: Date;
}
