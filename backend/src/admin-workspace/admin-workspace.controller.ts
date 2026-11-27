import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { AuthenticatedRequest } from '../common/types/authenticated-request.interface';
import { AdminWorkspaceService } from './admin-workspace.service';
import { ApplyTableEditDto } from './dto/apply-table-edit.dto';
import { RestoreTableRevisionDto } from './dto/restore-table-revision.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ARTIST)
export class AdminWorkspaceController {
  constructor(private readonly adminWorkspaceService: AdminWorkspaceService) {}

  @Get('search')
  search(@Request() req: AuthenticatedRequest, @Query('q') q = '') {
    return this.adminWorkspaceService.search(req.user, q);
  }

  @Get('tables/:tableKey/revisions')
  revisions(
    @Request() req: AuthenticatedRequest,
    @Param('tableKey') tableKey: string,
  ) {
    return this.adminWorkspaceService.getHistory(req.user, tableKey);
  }

  @Post('tables/:tableKey/edits')
  edit(
    @Request() req: AuthenticatedRequest,
    @Param('tableKey') tableKey: string,
    @Body() dto: ApplyTableEditDto,
  ) {
    return this.adminWorkspaceService.applyEdit(req.user, tableKey, dto);
  }

  @Post('tables/:tableKey/undo')
  undo(@Request() req: AuthenticatedRequest, @Param('tableKey') tableKey: string) {
    return this.adminWorkspaceService.undo(req.user, tableKey);
  }

  @Post('tables/:tableKey/redo')
  redo(@Request() req: AuthenticatedRequest, @Param('tableKey') tableKey: string) {
    return this.adminWorkspaceService.redo(req.user, tableKey);
  }

  @Post('tables/:tableKey/restore')
  restore(
    @Request() req: AuthenticatedRequest,
    @Param('tableKey') tableKey: string,
    @Body() dto: RestoreTableRevisionDto,
  ) {
    return this.adminWorkspaceService.restore(req.user, tableKey, dto.sequence);
  }
}
