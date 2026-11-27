import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import { AuditAction } from '../enums/audit-action.enum';
import { AuditTargetType } from '../enums/audit-target-type.enum';

@Entity('admin_audit_logs')
@Index(['createdAt'])
@Index(['actorUserId'])
@Index(['relatedArtistId'])
@Index(['actorRole'])
export class AdminAuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  actorUserId: number;

  @Column({ type: 'enum', enum: UserRole })
  actorRole: UserRole;

  @Column()
  actorName: string;

  @Column()
  actorEmail: string;

  @Column({ type: 'int', nullable: true })
  relatedArtistId: number | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  relatedArtistName: string | null;

  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Column({ type: 'enum', enum: AuditTargetType })
  targetType: AuditTargetType;

  @Column({ type: 'int', nullable: true })
  targetId: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  targetLabel: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;
}
