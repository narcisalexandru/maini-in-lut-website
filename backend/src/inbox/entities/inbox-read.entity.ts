import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { InboxThread } from './inbox-thread.entity';

@Entity('inbox_read')
@Unique(['threadId', 'userId'])
export class InboxRead {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  threadId: number;

  @ManyToOne(() => InboxThread, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'threadId' })
  thread: InboxThread;

  @Column()
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'timestamptz' })
  lastReadAt: Date;
}
