import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import {
  OrderPaymentStatus,
  PaymentMethod,
} from '../../common/enums/order-status.enum';
import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';

export type OrderBillingDetails = Record<string, unknown>;

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  publicOrderNumber: string;

  @Column({ type: 'int', nullable: true })
  userId: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @Column()
  customerFirstName: string;

  @Column()
  customerLastName: string;

  @Column()
  customerEmail: string;

  @Column()
  customerPhone: string;

  @Column()
  deliveryCounty: string;

  @Column()
  deliveryCity: string;

  @Column()
  deliveryStreet: string;

  @Column()
  deliveryPostalCode: string;

  @Column({ type: 'text', nullable: true })
  deliveryRecipientName: string | null;

  @Column({ type: 'text', nullable: true })
  deliveryRecipientPhone: string | null;

  @Column({ type: 'jsonb', nullable: true })
  billingDetails: OrderBillingDetails | null;

  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Column({
    type: 'enum',
    enum: OrderPaymentStatus,
    default: OrderPaymentStatus.PENDING,
  })
  paymentStatus: OrderPaymentStatus;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotalRon: number;

  @Column('decimal', { precision: 10, scale: 2 })
  deliveryFeeRon: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  cashOperationalFeeRon: number;

  @Column('decimal', { precision: 10, scale: 2 })
  totalRon: number;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
