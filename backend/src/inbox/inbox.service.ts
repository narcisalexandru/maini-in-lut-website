import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { ArtistsService } from '../artists/artists.service';
import { ArtistStatus } from '../common/enums/artist-status.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../users/entities/user.entity';
import { CreateInboxThreadDto, InboxAudience } from './dto/create-inbox-thread.dto';
import { InboxMessage } from './entities/inbox-message.entity';
import { InboxRead } from './entities/inbox-read.entity';
import { InboxThread } from './entities/inbox-thread.entity';
import { inboxRecipients } from './inbox-recipients.util';

const INBOX_IMAGE_PATH = /^\/uploads\/inbox\/[0-9a-f-]{36}\.webp$/;

export type InboxThreadSummary = {
  id: number;
  subject: string;
  artistId: number | null;
  artistName: string;
  broadcast: boolean;
  repliesDisabled: boolean;
  lastMessageAt: string;
  preview: string;
  hasImage: boolean;
  unread: boolean;
};

export type InboxMessageView = {
  id: number;
  body: string;
  imageUrl: string | null;
  createdAt: string;
  senderRole: UserRole;
  mine: boolean;
};

export type InboxThreadDetail = {
  id: number;
  subject: string;
  artistId: number | null;
  artistName: string;
  broadcast: boolean;
  repliesDisabled: boolean;
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
    const threads = await this.visibleThreads(user, artistIds);
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
          broadcast: thread.kind === 'broadcast',
          repliesDisabled: thread.repliesDisabled,
          lastMessageAt: thread.lastMessageAt.toISOString(),
          preview: this.preview(latest?.body ?? ''),
          hasImage: Boolean(latest?.imageUrl),
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
      broadcast: thread.kind === 'broadcast',
      repliesDisabled: thread.repliesDisabled,
      messages: messages.map((message) => ({
        id: message.id,
        body: message.body,
        imageUrl: message.imageUrl,
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
    const { body, imageUrl } = this.normalizeContent(dto.body, dto.imageUrl);
    if (subject.length < 3) {
      throw new BadRequestException('Message is empty');
    }

    const recipients = await this.resolveRecipients(user, dto);
    const now = new Date();
    const repliesDisabled = user.role === UserRole.SUPER_ADMIN && dto.noReply === true;
    const threadIds = await this.dataSource.transaction(async (manager) => {
      if (user.role === UserRole.SUPER_ADMIN && dto.audience === InboxAudience.ALL) {
        const parent = await manager.save(
          manager.create(InboxThread, {
            subject,
            artistId: null,
            createdById: user.id,
            lastMessageAt: now,
            kind: 'broadcast',
            broadcastId: null,
            spawnedFromBroadcastId: null,
            linkedThreadId: null,
            repliesDisabled,
            hiddenFromAdmin: false,
          }),
        );
        await manager.save(
          manager.create(InboxMessage, {
            threadId: parent.id,
            senderId: user.id,
            senderRole: user.role,
            body,
            imageUrl,
          }),
        );
        for (const artist of recipients) {
          const copy = await manager.save(
            manager.create(InboxThread, {
              subject,
              artistId: artist.id,
              createdById: user.id,
              lastMessageAt: now,
              kind: 'broadcast_copy',
              broadcastId: parent.id,
              spawnedFromBroadcastId: null,
              linkedThreadId: null,
              repliesDisabled,
              hiddenFromAdmin: true,
            }),
          );
          await manager.save(
            manager.create(InboxMessage, {
              threadId: copy.id,
              senderId: user.id,
              senderRole: user.role,
              body,
              imageUrl,
            }),
          );
        }
        return [parent.id];
      }

      const ids: number[] = [];
      for (const artist of recipients) {
        const thread = await manager.save(
          manager.create(InboxThread, {
            subject,
            artistId: artist.id,
            createdById: user.id,
            lastMessageAt: now,
            kind: 'direct',
            broadcastId: null,
            spawnedFromBroadcastId: null,
            linkedThreadId: null,
            repliesDisabled,
            hiddenFromAdmin: false,
          }),
        );
        await manager.save(
          manager.create(InboxMessage, {
            threadId: thread.id,
            senderId: user.id,
            senderRole: user.role,
            body,
            imageUrl,
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

  async reply(
    user: User,
    threadId: number,
    bodyInput: string | undefined,
    imageUrlInput: string | undefined,
  ): Promise<InboxThreadDetail> {
    const { body, imageUrl } = this.normalizeContent(bodyInput, imageUrlInput);
    const thread = await this.requireThread(user, threadId);
    if (thread.repliesDisabled) {
      throw new BadRequestException(
        'Acest mesaj este doar o notificare și nu poate primi răspuns.',
      );
    }
    const now = new Date();
    await this.dataSource.transaction(async (manager) => {
      const targets = await this.replyTargets(manager, thread, user);
      for (const target of targets) {
        await manager.save(
          manager.create(InboxMessage, {
            threadId: target.id,
            senderId: user.id,
            senderRole: user.role,
            body,
            imageUrl,
          }),
        );
        target.lastMessageAt = now;
        await manager.save(target);
      }
    });
    return this.getThread(user, thread.id);
  }

  async removeThread(user: User, threadId: number): Promise<{ deleted: true }> {
    const thread = await this.requireThread(user, threadId);
    await this.dataSource.transaction(async (manager) => {
      if (thread.kind === 'broadcast') {
        const copies = await manager.find(InboxThread, {
          where: { broadcastId: thread.id, kind: 'broadcast_copy' },
        });
        for (const copy of copies) {
          if (copy.linkedThreadId) {
            copy.kind = 'direct';
            copy.broadcastId = null;
            copy.repliesDisabled = false;
            copy.hiddenFromAdmin = true;
            await manager.save(copy);
          } else {
            await manager.delete(InboxMessage, { threadId: copy.id });
            await manager.delete(InboxRead, { threadId: copy.id });
            await manager.delete(InboxThread, { id: copy.id });
          }
        }
      }
      const ids = [thread.id];
      if (thread.linkedThreadId) {
        ids.push(thread.linkedThreadId);
      }
      await manager.delete(InboxMessage, { threadId: In(ids) });
      await manager.delete(InboxRead, { threadId: In(ids) });
      await manager.delete(InboxThread, { id: In(ids) });
    });
    return { deleted: true };
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

  private async visibleThreads(user: User, artistIds: number[]): Promise<InboxThread[]> {
    const query = this.threadsRepository
      .createQueryBuilder('thread')
      .leftJoinAndSelect('thread.artist', 'artist')
      .orderBy('thread.lastMessageAt', 'DESC');

    if (user.role === UserRole.SUPER_ADMIN) {
      query.where('thread.kind != :copy', { copy: 'broadcast_copy' });
      query.andWhere('thread.hiddenFromAdmin = false');
      if (artistIds.length > 0) {
        query.andWhere(
          '(thread.artistId IN (:...artistIds) OR thread.kind = :broadcast)',
          { artistIds, broadcast: 'broadcast' },
        );
      } else {
        query.andWhere('thread.kind = :broadcast', { broadcast: 'broadcast' });
      }
      return query.getMany();
    }

    if (artistIds.length === 0) {
      return [];
    }
    return query
      .where('thread.artistId = :artistId', { artistId: artistIds[0] })
      .andWhere('thread.kind != :broadcast', { broadcast: 'broadcast' })
      .andWhere('thread.spawnedFromBroadcastId IS NULL')
      .getMany();
  }

  private async replyTargets(
    manager: EntityManager,
    thread: InboxThread,
    user: User,
  ): Promise<InboxThread[]> {
    if (
      user.role === UserRole.ARTIST &&
      thread.kind === 'broadcast_copy' &&
      thread.broadcastId
    ) {
      const direct = await this.ensureDirectThread(manager, thread);
      return [thread, direct];
    }
    if (thread.kind === 'broadcast') {
      const copies = await manager.find(InboxThread, {
        where: { broadcastId: thread.id, kind: 'broadcast_copy' },
      });
      const linkedIds = copies
        .map((copy) => copy.linkedThreadId)
        .filter((id): id is number => id !== null);
      const linked = linkedIds.length
        ? await manager.find(InboxThread, { where: { id: In(linkedIds) } })
        : [];
      return [thread, ...copies, ...linked];
    }
    if (!thread.linkedThreadId) {
      return [thread];
    }
    const linked = await manager.findOne(InboxThread, {
      where: { id: thread.linkedThreadId },
    });
    return linked ? [thread, linked] : [thread];
  }

  private async ensureDirectThread(
    manager: EntityManager,
    copy: InboxThread,
  ): Promise<InboxThread> {
    const existing = await manager.findOne(InboxThread, {
      where: {
        kind: 'direct',
        artistId: copy.artistId ?? undefined,
        spawnedFromBroadcastId: copy.broadcastId ?? undefined,
      },
    });
    if (existing) {
      return existing;
    }
    const direct = await manager.save(
      manager.create(InboxThread, {
        subject: copy.subject,
        artistId: copy.artistId,
        createdById: copy.createdById,
        lastMessageAt: copy.lastMessageAt,
        kind: 'direct',
        broadcastId: null,
        spawnedFromBroadcastId: copy.broadcastId,
        linkedThreadId: copy.id,
        repliesDisabled: false,
        hiddenFromAdmin: false,
      }),
    );
    const history = await manager.find(InboxMessage, {
      where: { threadId: copy.id },
      order: { createdAt: 'ASC', id: 'ASC' },
    });
    for (const message of history) {
      await manager.save(
        manager.create(InboxMessage, {
          threadId: direct.id,
          senderId: message.senderId,
          senderRole: message.senderRole,
          body: message.body,
          imageUrl: message.imageUrl,
        }),
      );
    }
    copy.linkedThreadId = direct.id;
    await manager.save(copy);
    return direct;
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

  private normalizeContent(
    bodyInput: string | undefined,
    imageUrlInput: string | undefined,
  ): { body: string; imageUrl: string | null } {
    const body = (bodyInput ?? '').trim();
    const imageUrl = (imageUrlInput ?? '').trim();
    if (imageUrl && !INBOX_IMAGE_PATH.test(imageUrl)) {
      throw new BadRequestException('Invalid image');
    }
    if (!body && !imageUrl) {
      throw new BadRequestException('Message is empty');
    }
    return { body, imageUrl: imageUrl || null };
  }

  private preview(body: string): string {
    const compact = body.replace(/\s+/g, ' ').trim();
    return compact.length > 120 ? `${compact.slice(0, 117)}...` : compact;
  }
}
