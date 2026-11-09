export type AppointmentStatus = 'pending_confirmation' | 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
// Statuses that hold a doctor's calendar slot and must block new bookings for the same time.
export const ACTIVE_APPOINTMENT_STATUSES: AppointmentStatus[] = ['pending_confirmation', 'scheduled', 'confirmed'];
export type AppointmentType = 'online' | 'in-person' | 'emergency';

export interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  hospitalId: number;
  appointmentType: AppointmentType;
  status: AppointmentStatus;
  scheduledTime: Date;
  endTime: Date | null;
  actualTime?: Date;
  duration: number;
  symptoms?: string[];
  priority?: number;
  notes?: string;
  cancellationReason?: string;
  meetingLink?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAppointmentDto {
  patientId: number;
  doctorId: number;
  hospitalId?: number; // Optional - will use doctor's hospital or default
  appointmentType: AppointmentType;
  scheduledTime: Date;
  duration?: number;
  symptoms?: string[];
  notes?: string;
}

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  available: boolean;
  doctorId: number;
}

export interface AppointmentWithDetails extends Appointment {
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorEmail?: string;
  hospitalName: string;
  hospitalAddress: string;
}
