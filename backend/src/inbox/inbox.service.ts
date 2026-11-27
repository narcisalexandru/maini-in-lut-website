import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { ArtistsService } from '../artists/artists.service';
import { ArtistStatus } from '../common/enums/artist-status.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../users/entities/user.entity';
import { CreateInboxThreadDto, InboxAudience } from './dto/create-inbox-thread.dto';
import { InboxMessage } from './entities/inbox-message.entity';
import { InboxRead } from './entities/inbox-read.entity';
import { InboxThread } from './entities/inbox-thread.entity';
import { inboxRecipients } from './inbox-recipients.util';

export type InboxThreadSummary = {
  id: number;
  subject: string;
  artistId: number;
  artistName: string;
  lastMessageAt: string;
  preview: string;
  unread: boolean;
};

export type InboxMessageView = {
  id: number;
  body: string;
  createdAt: string;
  senderRole: UserRole;
  mine: boolean;
};

export type InboxThreadDetail = {
  id: number;
  subject: string;
  artistId: number;
  artistName: string;
  messages: InboxMessageView[];
};

@Injectable()
export class InboxService {
  constructor(
    @InjectRepository(InboxThread)
    private readonly threadsRepository: Repository<InboxThread>,
    @InjectRepository(InboxMessage)
    private readonly messagesRepository: Repository<InboxMessage>,
    @InjectRepository(InboxRead)
    private readonly readsRepository: Repository<InboxRead>,
    private readonly artistsService: ArtistsService,
    private readonly dataSource: DataSource,
  ) {}

  async listThreads(user: User): Promise<{
    threads: InboxThreadSummary[];
    artists: { id: number; displayName: string }[];
  }> {
    const artistIds = await this.visibleArtistIds(user);
    const artists = await this.composeArtists(user);
    if (artistIds.length === 0) {
      return { threads: [], artists };
    }

    const threads = await this.threadsRepository.find({
      where: { artistId: In(artistIds) },
      relations: ['artist'],
      order: { lastMessageAt: 'DESC' },
    });
    if (threads.length === 0) {
      return { threads: [], artists };
    }

    const threadIds = threads.map((thread) => thread.id);
    const [latestMessages, reads] = await Promise.all([
      this.latestMessages(threadIds),
      this.readsRepository.find({ where: { userId: user.id, threadId: In(threadIds) } }),
    ]);
    const readAt = new Map(reads.map((read) => [read.threadId, read.lastReadAt]));

    return {
      artists,
      threads: threads.map((thread) => {
        const latest = latestMessages.get(thread.id);
        const seenAt = readAt.get(thread.id);
        const unread = Boolean(
          latest &&
            latest.senderId !== user.id &&
            (!seenAt || seenAt < latest.createdAt),
        );
        return {
          id: thread.id,
          subject: thread.subject,
          artistId: thread.artistId,
          artistName: thread.artist?.displayName ?? '',
          lastMessageAt: thread.lastMessageAt.toISOString(),
          preview: this.preview(latest?.body ?? ''),
          unread,
        };
      }),
    };
  }

  async unreadCount(user: User): Promise<{ count: number }> {
    const { threads } = await this.listThreads(user);
    return { count: threads.filter((thread) => thread.unread).length };
  }

  async getThread(user: User, threadId: number): Promise<InboxThreadDetail> {
    const thread = await this.requireThread(user, threadId);
    await this.markRead(user.id, thread.id);
    const messages = await this.messagesRepository.find({
      where: { threadId: thread.id },
      order: { createdAt: 'ASC', id: 'ASC' },
    });
    return {
      id: thread.id,
      subject: thread.subject,
      artistId: thread.artistId,
      artistName: thread.artist?.displayName ?? '',
      messages: messages.map((message) => ({
        id: message.id,
        body: message.body,
        createdAt: message.createdAt.toISOString(),
        senderRole: message.senderRole,
        mine: message.senderId === user.id,
      })),
    };
  }

  async createThread(
    user: User,
    dto: CreateInboxThreadDto,
  ): Promise<{ threadIds: number[] }> {
    const subject = dto.subject.trim();
    const body = dto.body.trim();
    if (!subject || !body) {
      throw new BadRequestException('Message is empty');
    }

    const recipients = await this.resolveRecipients(user, dto);
    const now = new Date();
    const threadIds = await this.dataSource.transaction(async (manager) => {
      const ids: number[] = [];
      for (const artist of recipients) {
        const thread = await manager.save(
          manager.create(InboxThread, {
            subject,
            artistId: artist.id,
            createdById: user.id,
            lastMessageAt: now,
          }),
        );
        await manager.save(
          manager.create(InboxMessage, {
            threadId: thread.id,
            senderId: user.id,
            senderRole: user.role,
            body,
          }),
        );
        ids.push(thread.id);
      }
      return ids;
    });

    if (user.role !== UserRole.SUPER_ADMIN && threadIds[0]) {
      await this.markRead(user.id, threadIds[0]);
    }
    return { threadIds };
  }

  async reply(user: User, threadId: number, bodyInput: string): Promise<InboxThreadDetail> {
    const body = bodyInput.trim();
    if (!body) {
      throw new BadRequestException('Message is empty');
    }
    const thread = await this.requireThread(user, threadId);
    const now = new Date();
    await this.dataSource.transaction(async (manager) => {
      await manager.save(
        manager.create(InboxMessage, {
          threadId: thread.id,
          senderId: user.id,
          senderRole: user.role,
          body,
        }),
      );
      thread.lastMessageAt = now;
      await manager.save(thread);
    });
    return this.getThread(user, thread.id);
  }

  private async resolveRecipients(user: User, dto: CreateInboxThreadDto) {
    if (user.role === UserRole.SUPER_ADMIN) {
      const artists = await this.recipientArtists();
      if (dto.audience === InboxAudience.ALL) {
        if (artists.length === 0) {
          throw new BadRequestException('No artists available');
        }
        return artists;
      }
      const artist = artists.find((item) => item.id === dto.artistId);
      if (!artist) {
        throw new BadRequestException('Artist not found');
      }
      return [artist];
    }

    const artist = await this.artistsService.findApprovedByUserId(user.id);
    if (!artist) {
      throw new ForbiddenException('Approved artist profile required');
    }
    return [{ id: artist.id, displayName: artist.displayName }];
  }

  private async recipientArtists() {
    const artists = await this.artistsService.findAllForAdmin();
    const allowedIds = new Set(
      inboxRecipients(
        artists.map((artist) => ({
          id: artist.id,
          userId: artist.userId,
          status: artist.status,
        })),
      ).map((artist) => artist.id),
    );
    return artists
      .filter((artist) => allowedIds.has(artist.id))
      .map((artist) => ({ id: artist.id, displayName: artist.displayName }));
  }

  private async composeArtists(user: User) {
    if (user.role !== UserRole.SUPER_ADMIN) {
      return [];
    }
    return this.recipientArtists();
  }

  private async visibleArtistIds(user: User): Promise<number[]> {
    if (user.role === UserRole.SUPER_ADMIN) {
      const artists = await this.recipientArtists();
      return artists.map((artist) => artist.id);
    }
    const artist = await this.artistsService.findApprovedByUserId(user.id);
    if (!artist) {
      throw new ForbiddenException('Approved artist profile required');
    }
    return [artist.id];
  }

  private async requireThread(user: User, threadId: number): Promise<InboxThread> {
    const thread = await this.threadsRepository.findOne({
      where: { id: threadId },
      relations: ['artist'],
    });
    if (!thread) {
      throw new NotFoundException('Conversation not found');
    }
    if (user.role !== UserRole.SUPER_ADMIN) {
      const artist = await this.artistsService.findApprovedByUserId(user.id);
      if (!artist || artist.id !== thread.artistId) {
        throw new ForbiddenException('Approved artist profile required');
      }
    }
    return thread;
  }

  private async latestMessages(threadIds: number[]): Promise<Map<number, InboxMessage>> {
    const messages = await this.messagesRepository
      .createQueryBuilder('message')
      .distinctOn(['message.threadId'])
      .where('message.threadId IN (:...threadIds)', { threadIds })
      .orderBy('message.threadId', 'ASC')
      .addOrderBy('message.createdAt', 'DESC')
      .getMany();
    return new Map(messages.map((message) => [message.threadId, message]));
  }

  private async markRead(userId: number, threadId: number): Promise<void> {
    const existing = await this.readsRepository.findOne({
      where: { userId, threadId },
    });
    const lastReadAt = new Date();
    if (existing) {
      existing.lastReadAt = lastReadAt;
      await this.readsRepository.save(existing);
      return;
    }
    await this.readsRepository.save(
      this.readsRepository.create({ userId, threadId, lastReadAt }),
    );
  }

  private preview(body: string): string {
    const compact = body.replace(/\s+/g, ' ').trim();
    return compact.length > 120 ? `${compact.slice(0, 117)}...` : compact;
  }
}
