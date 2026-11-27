import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthenticatedRequest } from '../common/types/authenticated-request.interface';
import { UploadsService } from '../uploads/uploads.service';
import { CreateInboxThreadDto } from './dto/create-inbox-thread.dto';
import { ReplyInboxDto } from './dto/reply-inbox.dto';
import { InboxService } from './inbox.service';

@Controller('admin/inbox')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InboxController {
  constructor(
    private readonly inboxService: InboxService,
    private readonly uploadsService: UploadsService,
  ) {}

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
  @Post('images')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.uploadsService.saveInboxImage(file);
  }

  @Roles(UserRole.ARTIST, UserRole.SUPER_ADMIN)
  @Post('threads/:id/messages')
  reply(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReplyInboxDto,
  ) {
    return this.inboxService.reply(req.user, id, dto.body, dto.imageUrl);
  }

  @Roles(UserRole.ARTIST, UserRole.SUPER_ADMIN)
  @Delete('threads/:id')
  remove(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.inboxService.removeThread(req.user, id);
  }
}
