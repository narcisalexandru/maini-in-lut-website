import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminAuditLog } from './entities/admin-audit-log.entity';
import { AuditAction } from './enums/audit-action.enum';
import { AuditTargetType } from './enums/audit-target-type.enum';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';
import { UsersService } from '../users/users.service';
import { Artist } from '../artists/entities/artist.entity';

export type RecordAuditLogInput = {
  action: AuditAction;
  targetType: AuditTargetType;
  targetId?: number | null;
  targetLabel?: string | null;
  relatedArtistId?: number | null;
  relatedArtistName?: string | null;
  metadata?: Record<string, unknown> | null;
};

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AdminAuditLog)
    private readonly auditLogsRepository: Repository<AdminAuditLog>,
    @InjectRepository(Artist)
    private readonly artistsRepository: Repository<Artist>,
    private readonly usersService: UsersService,
  ) {}

  async record(actor: User, input: RecordAuditLogInput): Promise<void> {
    try {
      const entry = this.auditLogsRepository.create({
        actorUserId: actor.id,
        actorRole: actor.role,
        actorName: `${actor.first_name} ${actor.last_name}`.trim(),
        actorEmail: actor.email,
        relatedArtistId: input.relatedArtistId ?? null,
        relatedArtistName: input.relatedArtistName ?? null,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId ?? null,
        targetLabel: input.targetLabel ?? null,
        metadata: input.metadata ?? null,
      });

      await this.auditLogsRepository.save(entry);
    } catch (error) {
      this.logger.error(
        'Failed to record admin audit log',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async findAll(query: ListAuditLogsQueryDto): Promise<AdminAuditLog[]> {
    const qb = this.auditLogsRepository
      .createQueryBuilder('log')
      .orderBy('log.createdAt', 'DESC')
      .take(500);

    if (query.actorUserId) {
      qb.andWhere('log.actorUserId = :actorUserId', {
        actorUserId: query.actorUserId,
      });
    }

    if (query.actorRole) {
      qb.andWhere('log.actorRole = :actorRole', {
        actorRole: query.actorRole,
      });
    }

    if (query.relatedArtistId) {
      qb.andWhere('log.relatedArtistId = :relatedArtistId', {
        relatedArtistId: query.relatedArtistId,
      });
    }

    if (query.action) {
      qb.andWhere('log.action = :action', { action: query.action });
    }

    return qb.getMany();
  }

  async getFilterOptions(): Promise<{
    superAdmins: Array<{
      id: number;
      name: string;
      email: string;
    }>;
    artists: Array<{
      id: number;
      userId: number | null;
      displayName: string;
      email: string | null;
    }>;
    actions: AuditAction[];
  }> {
    const superAdminUsers = await this.usersService.findAllSanitized();
    const superAdmins = superAdminUsers
      .filter((user) => user.role === UserRole.SUPER_ADMIN)
      .map((user) => ({
        id: user.id,
        name: `${user.first_name} ${user.last_name}`.trim(),
        email: user.email,
      }));

    const artistProfiles = await this.artistsRepository.find({
      where: { isPlatform: false },
      relations: ['user'],
      order: { displayName: 'ASC' },
    });
    const artists = artistProfiles.map((artist) => ({
        id: artist.id,
        userId: artist.userId,
        displayName: artist.displayName,
        email: artist.contactEmail ?? artist.user?.email ?? null,
      }));

    return {
      superAdmins,
      artists,
      actions: Object.values(AuditAction),
    };
  }
}
