import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column()
  image: string;

  @Column({ default: true })
  inStock: boolean;

  @Column()
  category: string;

  @Column({ type: 'timestamp', nullable: true })
  datePublished: Date;

  @Column({ type: 'int', default: 0 })
  popularity: number;

  @Column({ type: 'float', default: 0 })
  discount: number;

  @Column({ type: 'int', default: 0 })
  reviewsCount: number;

  @Column({ type: 'float', nullable: true })
  priceBeforeDiscount: number | null;
}
