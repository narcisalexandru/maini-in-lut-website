import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from '../../users/entities/user.entity';
import { InboxThread } from './inbox-thread.entity';

@Entity('inbox_message')
export class InboxMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  threadId: number;

  @ManyToOne(() => InboxThread, (thread) => thread.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'threadId' })
  thread: InboxThread;

  @Column()
  senderId: number;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column({ type: 'enum', enum: UserRole })
  senderRole: UserRole;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  imageUrl: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
