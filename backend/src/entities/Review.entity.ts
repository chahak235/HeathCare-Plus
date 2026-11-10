import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * A patient's review of a doctor after a real appointment. One review per
 * appointment; only appointments that have already taken place can be reviewed.
 */
@Entity('reviews')
@Index(['doctorId', 'createdAt'])
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ name: 'appointment_id', type: 'int' })
  appointmentId: number;

  @Column({ name: 'doctor_id', type: 'int' })
  doctorId: number;

  @Column({ name: 'patient_id', type: 'int' })
  patientId: number;

  /** Shown publicly, e.g. "Chahak A." (first name and last initial only) */
  @Column({ name: 'display_name', type: 'varchar', length: 60 })
  displayName: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'varchar', length: 600, nullable: true })
  comment: string | null;

  /** Hospital/admin staff can hide abusive or identifying reviews */
  @Column({ name: 'is_published', type: 'boolean', default: true })
  isPublished: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
