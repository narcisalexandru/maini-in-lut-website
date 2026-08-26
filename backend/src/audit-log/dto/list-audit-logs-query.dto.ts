import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '../../common/enums/user-role.enum';
import { AuditAction } from '../enums/audit-action.enum';

export class ListAuditLogsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  actorUserId?: number;

  @IsOptional()
  @IsEnum(UserRole)
  actorRole?: UserRole;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  relatedArtistId?: number;

  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;
}
