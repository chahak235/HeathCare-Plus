import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { Patient } from './Patient.entity';
import { Doctor } from './Doctor.entity';
import { Hospital } from './Hospital.entity';
import { Bed } from './Bed.entity';

@Entity('admissions')
export class Admission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'patient_id', nullable: true })
  patientId: number;

  @Column({ name: 'bed_id', nullable: true })
  bedId: number;

  @Column({ name: 'doctor_id', nullable: true })
  doctorId: number;

  @Column({ name: 'hospital_id', nullable: true })
  hospitalId: number;

  @Column({ name: 'admission_type', length: 50, nullable: true })
  admissionType: string;

  @Column({ nullable: true })
  priority: number;

  @Column({ length: 50, default: 'waiting' })
  status: string;

  @Column({ name: 'admitting_diagnosis', type: 'text', nullable: true })
  admittingDiagnosis: string;

  @Column({ name: 'discharge_diagnosis', type: 'text', nullable: true })
  dischargeDiagnosis: string;

  @Column({ name: 'admitted_at', type: 'timestamp', nullable: true })
  admittedAt: Date;

  @Column({ name: 'discharged_at', type: 'timestamp', nullable: true })
  dischargedAt: Date;

  @Column({ name: 'expected_discharge', type: 'timestamp', nullable: true })
  expectedDischarge: Date;

  @Column({ name: 'discharge_notes', type: 'text', nullable: true })
  dischargeNotes: string;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Patient, patient => patient.admissions)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @ManyToOne(() => Doctor, doctor => doctor.admissions)
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @ManyToOne(() => Hospital, hospital => hospital.admissions)
  @JoinColumn({ name: 'hospital_id' })
  hospital: Hospital;

  @OneToOne(() => Bed, bed => bed.admission)
  @JoinColumn({ name: 'bed_id' })
  bed: Bed;
}
