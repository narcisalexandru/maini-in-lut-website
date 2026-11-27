import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('admin_table_revisions')
@Index(['userId', 'tableKey', 'sequence'], { unique: true })
export class AdminTableRevision {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ length: 80 })
  tableKey: string;

  @Column({ type: 'int' })
  sequence: number;

  @Column({ type: 'varchar', length: 240 })
  summary: string;

  @Column({ length: 40 })
  kind: string;

  @Column({ type: 'int' })
  targetId: number;

  @Column({ length: 40 })
  field: string;

  @Column({ type: 'varchar', length: 80 })
  fieldLabel: string;

  @Column({ type: 'varchar', length: 200 })
  rowLabel: string;

  @Column({ type: 'jsonb', nullable: true })
  previousValue: string | number | boolean | null;

  @Column({ type: 'jsonb', nullable: true })
  nextValue: string | number | boolean | null;

  @CreateDateColumn()
  createdAt: Date;
}
