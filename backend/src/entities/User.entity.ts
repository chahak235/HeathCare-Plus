import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne } from 'typeorm';
import { Patient } from './Patient.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100, unique: true })
  email: string;

  @Column({ length: 20 })
  phone: string;

  @Column({ length: 255 })
  password: string;

  @Column({ length: 20, default: 'patient' })
  role: string;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'verification_token', nullable: true })
  verificationToken: string;

  /** SHA-256 of the emailed reset token (never the token itself) */
  @Column({ name: 'reset_token', type: 'varchar', nullable: true })
  resetToken: string | null;

  @Column({ name: 'reset_token_expires', type: 'timestamp', nullable: true })
  resetTokenExpires: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => Patient, patient => patient.user)
  patient: Patient;
}
