import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('order_public_number')
export class OrderPublicNumber {
  @PrimaryColumn()
  id: number;

  @Column({ type: 'int' })
  value: number;
}
