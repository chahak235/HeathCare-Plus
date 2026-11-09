import { Entity, Column, ManyToOne, PrimaryColumn, JoinColumn } from 'typeorm';
import { Doctor } from './Doctor.entity';
import { Hospital } from './Hospital.entity';

@Entity('doctor_hospitals')
export class DoctorHospital {
  @PrimaryColumn({ name: 'doctor_id' })
  doctorId: number;

  @PrimaryColumn({ name: 'hospital_id' })
  hospitalId: number;

  @Column({ name: 'is_primary', default: false })
  isPrimary: boolean;

  @Column({ name: 'consultation_fee', type: 'decimal', precision: 8, scale: 2, nullable: true })
  consultationFee: number;

  @Column('text', { array: true, nullable: true })
  availableDays: string[];

  @Column({ name: 'available_hours', length: 100, nullable: true })
  availableHours: string;

  @Column({ name: 'is_available', default: true })
  isAvailable: boolean;

  @Column({ name: 'current_patients', default: 0 })
  currentPatients: number;

  @Column({ name: 'max_patients', default: 10 })
  maxPatients: number;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Doctor, doctor => doctor.hospitalLinks)
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @ManyToOne(() => Hospital, hospital => hospital.doctors)
  @JoinColumn({ name: 'hospital_id' })
  hospital: Hospital;
}
