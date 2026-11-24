import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('admin_table_cursors')
@Index(['userId', 'tableKey'], { unique: true })
export class AdminTableCursor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ length: 80 })
  tableKey: string;

  @Column({ type: 'int', default: 0 })
  cursor: number;
}
