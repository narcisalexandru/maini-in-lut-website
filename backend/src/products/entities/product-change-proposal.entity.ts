import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProposalStatus } from '../../common/enums/proposal-status.enum';
import { Product } from './product.entity';

export type ProductProposalChanges = {
  title?: string;
  description?: string;
  price?: number;
  image?: string;
  images?: string[];
  category?: string;
  material?: string | null;
  capacity?: string | null;
  dimensions?: string | null;
  dishwasherSafe?: boolean;
  microwaveSafe?: boolean;
  inStock?: boolean;
  isSet?: boolean;
  stockQuantity?: number;
  discount?: number;
  priceBeforeDiscount?: number | null;
};

@Entity()
export class ProductChangeProposal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  productId: number;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'int' })
  proposedById: number;

  @Column({ type: 'jsonb' })
  changes: ProductProposalChanges;

  @Column({
    type: 'enum',
    enum: ProposalStatus,
    default: ProposalStatus.PENDING,
  })
  status: ProposalStatus;

  @Column({ type: 'text', nullable: true })
  artistMessage: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date | null;
}
