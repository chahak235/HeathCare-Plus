export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  qualification: string[];
  experienceYears: number;
  hospitalId: string;
  isOnDuty: boolean;
  isEmergencyAvailable: boolean;
  isOnlineAvailable: boolean;
  currentPatients: number;
  maxPatients: number;
  phone: string;
  email: string;
  schedule: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDoctorDto {
  name: string;
  specialty: string;
  qualification: string[];
  experienceYears: number;
  hospitalId: string;
  phone: string;
  email: string;
}

export interface UpdateDoctorDto {
  name?: string;
  specialty?: string;
  qualification?: string[];
  experienceYears?: number;
  isOnDuty?: boolean;
  isEmergencyAvailable?: boolean;
  isOnlineAvailable?: boolean;
  currentPatients?: number;
  maxPatients?: number;
  phone?: string;
  email?: string;
  schedule?: any;
}

export interface DoctorFilterOptions {
  specialty?: string;
  isOnDuty?: boolean;
  isEmergencyAvailable?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface DoctorListResponse {
  doctors: Doctor[];
  total: number;
  limit: number;
  offset: number;
}

export interface Specialty {
  id: string;
  name: string;
  description?: string;
  icuRequired: boolean;
  typicalStayHours: number;
}
