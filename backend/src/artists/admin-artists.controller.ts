import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ArtistsService } from './artists.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { AuthenticatedRequest } from '../common/types/authenticated-request.interface';
import { RejectArtistDto } from './dto/reject-artist.dto';
import { SuspendArtistDto } from './dto/suspend-artist.dto';
import { ArtistStatus } from '../common/enums/artist-status.enum';
import { toArtistResponse } from './utils/artist-response.util';
import { IsEnum, IsOptional } from 'class-validator';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction } from '../audit-log/enums/audit-action.enum';
import { AuditTargetType } from '../audit-log/enums/audit-target-type.enum';
import { artistAuditContext } from '../audit-log/utils/audit-log-context.util';

class ListArtistsQueryDto {
  @IsOptional()
  @IsEnum(ArtistStatus)
  status?: ArtistStatus;
}

@Controller('admin/artists')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AdminArtistsController {
  constructor(
    private readonly artistsService: ArtistsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get()
  async findAll(@Query() query: ListArtistsQueryDto) {
    const artists = await this.artistsService.findAllForAdmin(query.status);
    return artists.map((artist) => toArtistResponse(artist, true));
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const artist = await this.artistsService.findOneForAdmin(id);
    return toArtistResponse(artist, true);
  }

  @Patch(':id/approve')
  async approve(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const artist = await this.artistsService.approve(id, req.user.id);
    await this.auditLogService.record(req.user, {
      action: AuditAction.ARTIST_APPROVED,
      targetType: AuditTargetType.ARTIST,
      ...artistAuditContext(artist),
    });
    return toArtistResponse(artist, true);
  }

  @Patch(':id/reject')
  async reject(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectArtistDto,
  ) {
    const artist = await this.artistsService.reject(
      id,
      req.user.id,
      dto.reason,
    );
    await this.auditLogService.record(req.user, {
      action: AuditAction.ARTIST_REJECTED,
      targetType: AuditTargetType.ARTIST,
      ...artistAuditContext(artist),
      metadata: { reason: dto.reason.trim() },
    });
    return toArtistResponse(artist, true);
  }

  @Patch(':id/suspend')
  async suspend(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SuspendArtistDto,
  ) {
    const artist = await this.artistsService.suspend(
      id,
      req.user.id,
      dto.reason,
    );
    await this.auditLogService.record(req.user, {
      action: AuditAction.ARTIST_SUSPENDED,
      targetType: AuditTargetType.ARTIST,
      ...artistAuditContext(artist),
      metadata: { reason: dto.reason.trim() },
    });
    return toArtistResponse(artist, true);
  }

  @Patch(':id/reactivate')
  async reactivate(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const artist = await this.artistsService.reactivate(id, req.user.id);
    await this.auditLogService.record(req.user, {
      action: AuditAction.ARTIST_REACTIVATED,
      targetType: AuditTargetType.ARTIST,
      ...artistAuditContext(artist),
    });
    return toArtistResponse(artist, true);
  }

  @Delete(':id/account')
  async deleteAccount(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const artist = await this.artistsService.findOneForAdmin(id);
    const context = artistAuditContext(artist);
    await this.artistsService.deleteAccountByAdmin(id);
    await this.auditLogService.record(req.user, {
      action: AuditAction.ARTIST_DELETED,
      targetType: AuditTargetType.ARTIST,
      ...context,
      metadata: {
        userEmail: artist.user?.email ?? artist.contactEmail ?? null,
      },
    });
    return { success: true, message: 'Artist account deleted successfully' };
  }
}
