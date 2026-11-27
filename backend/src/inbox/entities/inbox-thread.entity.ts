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
  @Column()
  artistId: number;

  @ManyToOne(() => Artist, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'artistId' })
  artist: Artist;

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
