import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { encryptedText } from '../utils/field-crypto';

/**
 * A patient pressed SOS. Kept so hospital staff can see and respond to it in
 * the dashboard. Location is stored encrypted (like other health data).
 */
@Entity('emergency_alerts')
@Index(['createdAt'])
export class EmergencyAlert {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  /** "lat,lng" with 5 decimals (about 1 m), encrypted at rest */
  @Column({ type: 'text', nullable: true, transformer: encryptedText })
  location: string | null;

  @Column({ name: 'nearest_hospital', type: 'varchar', length: 200, nullable: true })
  nearestHospital: string | null;

  @Column({ name: 'contacts_emailed', type: 'int', default: 0 })
  contactsEmailed: number;

  /** open → acknowledged → resolved */
  @Column({ type: 'varchar', length: 20, default: 'open' })
  status: string;

  @Column({ name: 'handled_by', type: 'int', nullable: true })
  handledBy: number | null;

  @Column({ name: 'handled_at', type: 'timestamp', nullable: true })
  handledAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
