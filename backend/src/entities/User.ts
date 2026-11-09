import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  name!: string;

  @Column({ unique: true, length: 100 })
  email!: string;

  @Column({ length: 20 })
  phone!: string;

  @Column({ length: 255 })
  password!: string;

  @Column({ default: 'patient' })
  role!: string;

  @Column({ default: false })
  is_verified!: boolean;

  @Column({ nullable: true, length: 255 })
  verification_token?: string;

  @Column({ nullable: true, length: 255 })
  reset_token?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}