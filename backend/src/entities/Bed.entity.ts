import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { Hospital } from './Hospital.entity';
import { Patient } from './Patient.entity';
import { Admission } from './Admission.entity';

@Entity('beds')
export class Bed {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'hospital_id' })
  hospitalId: number;

  @Column({ name: 'bed_number', length: 20 })
  bedNumber: string;

  @Column({ length: 50, nullable: true })
  ward: string;

  @Column({ nullable: true })
  floor: number;

  @Column({ length: 50, nullable: true })
  type: string;

  @Column({ length: 50, nullable: true })
  specialty: string;

  @Column({ length: 20, default: 'available' })
  status: string;

  @Column('text', { array: true, nullable: true })
  equipment: string[];

  @Column({ name: 'last_cleaned', type: 'timestamp', nullable: true })
  lastCleaned: Date;

  @Column({ name: 'is_isolation', default: false })
  isIsolation: boolean;

  // Used by the allocation matching algorithm (bed-allocation.service.ts)
  // to score/filter candidate beds against patient requirements.
  @Column({ name: 'is_female_only', default: false })
  isFemaleOnly: boolean;

  @Column({ name: 'is_pediatric', default: false })
  isPediatric: boolean;

  @Column('text', { array: true, nullable: true })
  tags: string[];

  @Column({ name: 'current_patient_id', nullable: true })
  currentPatientId: number;

  @Column({ name: 'estimated_vacancy', type: 'timestamp', nullable: true })
  estimatedVacancy: Date;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Hospital, hospital => hospital.beds)
  @JoinColumn({ name: 'hospital_id' })
  hospital: Hospital;

  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'current_patient_id' })
  currentPatient: Patient;

  @OneToOne(() => Admission, admission => admission.bed)
  admission: Admission;
}
