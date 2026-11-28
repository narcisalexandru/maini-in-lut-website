import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import {
  WorkshopPaymentMethod,
  WorkshopPaymentStatus,
} from '../enums/workshop-payment.enum';
import { Workshop } from './workshop.entity';

@Entity('workshop_booking')
export class WorkshopBooking {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  publicCode: string;

  @Column()
  workshopId: number;

  @ManyToOne(() => Workshop, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workshopId' })
  workshop: Workshop;

  @Column({ type: 'int', nullable: true })
  userId: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @Column({ type: 'int' })
  spots: number;

  @Column()
  customerFirstName: string;

  @Column()
  customerLastName: string;

  @Column()
  customerEmail: string;

  @Column()
  customerPhone: string;

  @Column({ type: 'enum', enum: WorkshopPaymentMethod, enumName: 'workshop_payment_method_enum' })
  paymentMethod: WorkshopPaymentMethod;

  @Column({
    type: 'enum',
    enum: WorkshopPaymentStatus,
    enumName: 'workshop_payment_status_enum',
    default: WorkshopPaymentStatus.PENDING,
  })
  paymentStatus: WorkshopPaymentStatus;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: string;

  @Column({ type: 'text', nullable: true })
  netopiaNtpId: string | null;

  @Column({ default: false })
  confirmationSent: boolean;

  @Column({ type: 'varchar', length: 40, nullable: true })
  invoiceSeries: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  invoiceNumber: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
