import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('stock_reservations')
@Index(['productId', 'holderType', 'holderId'], { unique: true })
@Index(['expiresAt'])
export class StockReservation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  productId: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'varchar', length: 16 })
  holderType: 'user' | 'guest';

  @Column({ type: 'varchar', length: 64 })
  holderId: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
