import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProductStatus } from '../../common/enums/product-status.enum';
import { Artist } from '../../artists/entities/artist.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column()
  image: string;

  @Column({ type: 'jsonb', nullable: true })
  images: string[] | null;

  @Column({ default: true })
  inStock: boolean;

  @Column({ default: false })
  isSet: boolean;

  @Column({ type: 'int', default: 1 })
  stockQuantity: number;

  @Column()
  category: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  material: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  capacity: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  dimensions: string | null;

  @Column({ default: false })
  dishwasherSafe: boolean;

  @Column({ default: false })
  microwaveSafe: boolean;

  @Column({ type: 'timestamp', nullable: true })
  datePublished: Date | null;

  @Column({ type: 'int', default: 0 })
  popularity: number;

  @Column({ type: 'float', default: 0 })
  discount: number;

  @Column({ type: 'int', default: 0 })
  reviewsCount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceBeforeDiscount: number | null;

  @Column()
  artistId: number;

  @ManyToOne(() => Artist, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'artistId' })
  artist: Artist;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.DRAFT,
  })
  status: ProductStatus;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string | null;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'int', nullable: true })
  reviewedById: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
