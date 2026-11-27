import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthenticatedRequest } from '../common/types/authenticated-request.interface';
import { CreateInboxThreadDto } from './dto/create-inbox-thread.dto';
import { ReplyInboxDto } from './dto/reply-inbox.dto';
import { InboxService } from './inbox.service';

@Controller('admin/inbox')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InboxController {
  constructor(private readonly inboxService: InboxService) {}

  @Roles(UserRole.ARTIST, UserRole.SUPER_ADMIN)
  @Get('unread-count')
  unreadCount(@Request() req: AuthenticatedRequest) {
    return this.inboxService.unreadCount(req.user);
  }

  @Roles(UserRole.ARTIST, UserRole.SUPER_ADMIN)
  @Get('threads')
  threads(@Request() req: AuthenticatedRequest) {
    return this.inboxService.listThreads(req.user);
  }

  @Roles(UserRole.ARTIST, UserRole.SUPER_ADMIN)
  @Get('threads/:id')
  thread(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.inboxService.getThread(req.user, id);
  }

  @Roles(UserRole.ARTIST, UserRole.SUPER_ADMIN)
  @Post('threads')
  create(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateInboxThreadDto,
  ) {
    return this.inboxService.createThread(req.user, dto);
  }

  @Roles(UserRole.ARTIST, UserRole.SUPER_ADMIN)
  @Post('threads/:id/messages')
  reply(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReplyInboxDto,
  ) {
    return this.inboxService.reply(req.user, id, dto.body);
  }
}
