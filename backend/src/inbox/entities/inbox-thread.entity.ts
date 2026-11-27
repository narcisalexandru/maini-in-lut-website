import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Artist } from '../../artists/entities/artist.entity';
import { User } from '../../users/entities/user.entity';
import { InboxMessage } from './inbox-message.entity';

@Entity('inbox_thread')
export class InboxThread {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 160 })
  subject: string;

  @Index()
  @Column({ type: 'int', nullable: true })
  artistId: number | null;

  @ManyToOne(() => Artist, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'artistId' })
  artist: Artist | null;

  @Column({ type: 'varchar', length: 32, default: 'direct' })
  kind: 'direct' | 'broadcast' | 'broadcast_copy';

  @Column({ type: 'int', nullable: true })
  broadcastId: number | null;

  @Column({ type: 'int', nullable: true })
  spawnedFromBroadcastId: number | null;

  @Column({ type: 'int', nullable: true })
  linkedThreadId: number | null;

  @Column({ default: false })
  repliesDisabled: boolean;

  @Column({ default: false })
  hiddenFromAdmin: boolean;

  @Column()
  createdById: number;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ type: 'timestamptz' })
  lastMessageAt: Date;

  @OneToMany(() => InboxMessage, (message) => message.thread)
  messages: InboxMessage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
