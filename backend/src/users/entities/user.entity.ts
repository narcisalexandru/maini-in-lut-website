import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  first_name: string;

  @Column()
  email: string;

  @Column()
  last_name: string;

  @Column({ type: 'text', nullable: true })
  county: string;

  @Column({ type: 'text', nullable: true })
  city: string;

  @Column({ type: 'text', nullable: true })
  street: string;

  @Column({ type: 'text', nullable: true })
  postal_code: string;

  @Column({ type: 'text', nullable: true })
  phone: string;

  @Column({ nullable: true })
  picture?: string;

  @Column()
  password: string;

  @Column({ default: false })
  is_email_verified: boolean;

  @Column({ type: 'varchar', nullable: true })
  email_verification_token: string | null;

  @Column({ type: 'timestamp', nullable: true })
  email_verification_token_expires: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  address_modification_history: { timestamp: string }[];

  @Column({ type: 'timestamp', nullable: true })
  address_modification_cooldown: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export type UserWithoutPassword = Omit<User, 'password'>;
