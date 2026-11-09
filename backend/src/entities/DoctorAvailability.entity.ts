import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Doctor } from './Doctor.entity';
import { Hospital } from './Hospital.entity';

@Entity('doctor_availability')
@Unique(['doctorId', 'hospitalId'])
export class DoctorAvailability {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'doctor_id' })
  doctorId: number;

  @Column({ name: 'hospital_id' })
  hospitalId: number;

  @Column({ name: 'is_available', default: true })
  isAvailable: boolean;

  @Column({ name: 'current_patients', default: 0 })
  currentPatients: number;

  @Column({ name: 'max_patients', default: 10 })
  maxPatients: number;

  @Column({ name: 'available_until', type: 'timestamp', nullable: true })
  availableUntil: Date;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Doctor)
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @ManyToOne(() => Hospital)
  @JoinColumn({ name: 'hospital_id' })
  hospital: Hospital;
}
