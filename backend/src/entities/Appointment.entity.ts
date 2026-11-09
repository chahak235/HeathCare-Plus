import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Patient } from './Patient.entity';
import { Doctor } from './Doctor.entity';
import { Hospital } from './Hospital.entity';

@Entity('appointments')
// A doctor can only hold one active (pending/scheduled/confirmed) appointment
// per exact start time. This is the real guard against the double-booking
// race: two near-simultaneous bookings can both pass the application-level
// slot check, but only one can win this DB-level constraint — the loser gets
// a clean "slot just got taken" error instead of silently overbooking.
@Index('uq_doctor_active_slot', ['doctorId', 'scheduledTime'], {
  unique: true,
  where: `status IN ('pending_confirmation', 'scheduled', 'confirmed')`,
})
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'patient_id' })
  patientId: number;

  @Column({ name: 'doctor_id' })
  doctorId: number;

  @Column({ name: 'hospital_id' })
  hospitalId: number;

  @Column({ name: 'appointment_type', length: 20, default: 'in-person' })
  appointmentType: string;

  // Lifecycle: pending_confirmation -> confirmed -> completed
  //                                 -> cancelled (doctor declined, or patient/doctor cancels later)
  @Column({ length: 20, default: 'pending_confirmation' })
  status: string;

  @Column({ name: 'scheduled_time', type: 'timestamp' })
  scheduledTime: Date;

  @Column({ name: 'end_time', type: 'timestamp', nullable: true })
  endTime: Date;

  @Column({ name: 'actual_time', type: 'timestamp', nullable: true })
  actualTime: Date;

  @Column({ default: 30 })
  duration: number;

  @Column('text', { array: true, nullable: true })
  symptoms: string[];

  @Column({ nullable: true })
  priority: number;

  @Column('text', { nullable: true })
  notes: string;

  @Column({ name: 'cancellation_reason', nullable: true })
  cancellationReason: string;

  @Column({ name: 'meeting_link', nullable: true, type: 'text' })
  meetingLink: string | null;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @ManyToOne(() => Doctor)
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @ManyToOne(() => Hospital)
  @JoinColumn({ name: 'hospital_id' })
  hospital: Hospital;
}
