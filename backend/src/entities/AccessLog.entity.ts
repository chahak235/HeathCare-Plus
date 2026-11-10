import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Audit trail of access to health records: who viewed or changed which
 * patient's data, when, and from where. Written by middleware/access-log.ts.
 */
@Entity('access_logs')
@Index(['patientId', 'createdAt'])
export class AccessLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'int', nullable: true })
  userId: number | null;

  @Column({ name: 'user_role', type: 'varchar', length: 20, nullable: true })
  userRole: string | null;

  /** e.g. "view_health_profile", "update_health_profile", "view_appointments" */
  @Column({ type: 'varchar', length: 60 })
  action: string;

  @Column({ name: 'patient_id', type: 'int', nullable: true })
  patientId: number | null;

  @Column({ type: 'varchar', length: 200 })
  path: string;

  @Column({ type: 'varchar', length: 10 })
  method: string;

  @Column({ name: 'status_code', type: 'int' })
  statusCode: number;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ip: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
