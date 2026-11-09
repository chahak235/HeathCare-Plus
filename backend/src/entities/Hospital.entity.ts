import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { DoctorHospital } from './DoctorHospital.entity';
import { Bed } from './Bed.entity';
import { Admission } from './Admission.entity';

@Entity('indian_hospitals')
export class Hospital {
  @PrimaryGeneratedColumn()
  id: number;

  // Links this hospital to the admin account that manages it (signed up
  // with role='hospital'). Nullable because the 20 seeded hospitals have no
  // real admin yet.
  @Column({ name: 'user_id', type: 'int', nullable: true, unique: true })
  userId: number | null;

  @Column({ length: 200 })
  name: string;

  @Column('text', { nullable: true })
  address: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ length: 50, nullable: true })
  state: string;

  @Column({ length: 10, nullable: true })
  pincode: string;

  @Column('decimal', { precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column('decimal', { precision: 11, scale: 8, nullable: true })
  longitude: number;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 100, nullable: true })
  email: string;

  @Column({ length: 20, nullable: true, default: 'private' })
  type: string; // 'government' | 'private' | 'trust'

  @Column({ name: 'total_beds', nullable: true, default: 0 })
  totalBeds: number;

  @Column({ name: 'icu_beds', nullable: true, default: 0 })
  icuBeds: number;

  @Column({ name: 'operation_theatres', nullable: true, default: 0 })
  operationTheatres: number;

  @Column({ name: 'ambulances_total', nullable: true, default: 0 })
  ambulancesTotal: number;

  @Column({ name: 'ambulances_available', nullable: true, default: 0 })
  ambulancesAvailable: number;

  @Column({ name: 'emergency_contact', length: 20, nullable: true })
  emergencyContact: string;

  @Column({ name: 'ayushman_empaneled', default: false })
  ayushmanEmpaneled: boolean;

  @Column('decimal', { precision: 3, scale: 2, nullable: true, default: 4.2 })
  rating: number;

  @Column('text', { array: true, nullable: true })
  specialties: string[];

  @Column('jsonb', { nullable: true })
  metadata: any;

  // Relations
  @OneToMany(() => DoctorHospital, doctorHospital => doctorHospital.hospital)
  doctors: DoctorHospital[];

  @OneToMany(() => Bed, bed => bed.hospital)
  beds: Bed[];

  @OneToMany(() => Admission, admission => admission.hospital)
  admissions: Admission[];
}
