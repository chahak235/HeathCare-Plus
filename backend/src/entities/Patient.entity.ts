import { Entity, PrimaryGeneratedColumn, Column, OneToMany, JoinColumn, OneToOne } from 'typeorm';
import { Appointment } from './Appointment.entity';
import { Admission } from './Admission.entity';
import { User } from './User.entity';

@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', nullable: true })
  userId: number;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ name: 'blood_group', length: 5, nullable: true })
  bloodGroup: string;

  @Column('text', { array: true, nullable: true })
  allergies: string[];

  @Column({ name: 'chronic_conditions', type: 'text', array: true, nullable: true })
  chronicConditions: string[];

  @Column({ name: 'current_medications', type: 'text', array: true, nullable: true })
  currentMedications: string[];

  @Column({ name: 'emergency_contact', type: 'jsonb', nullable: true })
  emergencyContact: any;

  @Column({ length: 20, nullable: true })
  gender: string;

  @Column({ name: 'height_cm', type: 'real', nullable: true })
  heightCm: number;

  @Column({ name: 'weight_kg', type: 'real', nullable: true })
  weightKg: number;

  /** Family / emergency contacts: [{ name, relation, phone, email }] */
  @Column({ name: 'emergency_contacts', type: 'jsonb', nullable: true })
  emergencyContacts: { name: string; relation?: string; phone: string; email?: string }[];

  /** The hospital the patient usually visits: { name, phone, address, lat, lng } */
  @Column({ name: 'preferred_hospital', type: 'jsonb', nullable: true })
  preferredHospital: { name: string; phone?: string; address?: string; lat?: number; lng?: number } | null;

  @Column({ name: 'medical_notes', type: 'text', nullable: true })
  medicalNotes: string;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Appointment, appointment => appointment.patient)
  appointments: Appointment[];

  @OneToMany(() => Admission, admission => admission.patient)
  admissions: Admission[];
}
