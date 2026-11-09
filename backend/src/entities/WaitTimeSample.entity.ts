import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Doctor } from './Doctor.entity';
import { Hospital } from './Hospital.entity';
import { Patient } from './Patient.entity';

@Entity('wait_time_samples')
export class WaitTimeSample {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'doctor_id', nullable: true })
  doctorId: number;

  @Column({ name: 'hospital_id', nullable: true })
  hospitalId: number;

  @Column({ name: 'patient_id', nullable: true })
  patientId: number;

  @Column({ name: 'wait_time_minutes', nullable: true })
  waitTimeMinutes: number;

  @Column({ name: 'appointment_type', length: 50, nullable: true })
  appointmentType: string;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Doctor)
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @ManyToOne(() => Hospital)
  @JoinColumn({ name: 'hospital_id' })
  hospital: Hospital;

  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;
}
