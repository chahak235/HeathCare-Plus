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
