import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', nullable: true })
  userId: number;

  @Column({ name: 'user_type', length: 20, nullable: true })
  userType: string;

  @Column({ length: 50, nullable: true })
  type: string;

  @Column({ length: 200, nullable: true })
  title: string;

  @Column('text', { nullable: true })
  message: string;

  @Column({ length: 20, default: 'medium' })
  priority: string;

  @Column({ length: 20, default: 'pending' })
  status: string;

  @Column('jsonb', { nullable: true })
  data: any;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt: Date;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
