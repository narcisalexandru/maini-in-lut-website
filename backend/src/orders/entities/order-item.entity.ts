import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OrderItemStatus } from '../../common/enums/order-status.enum';
import { Order } from './order.entity';
import { Artist } from '../../artists/entities/artist.entity';

@Entity()
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  orderId: number;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column()
  productId: number;

  @Column()
  artistId: number;

  @ManyToOne(() => Artist, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'artistId' })
  artist: Artist;

  @Column()
  artistDisplayName: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  image: string | null;

  @Column({ type: 'int' })
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitPriceRon: number;

  @Column('decimal', { precision: 10, scale: 2 })
  lineTotalRon: number;

  @Column({
    type: 'enum',
    enum: OrderItemStatus,
    default: OrderItemStatus.PENDING,
  })
  status: OrderItemStatus;

  @Column({ type: 'timestamp', nullable: true })
  statusUpdatedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
