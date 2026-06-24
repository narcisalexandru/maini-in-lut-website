import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Artist } from './entities/artist.entity';
import { ApplyArtistDto } from './dto/apply-artist.dto';
import { ArtistStatus } from '../common/enums/artist-status.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { slugify } from '../common/utils/slug.util';
import { EmailService } from '../email/email.service';
import { Product } from '../products/entities/product.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { UserCartItem } from '../cart/entities/user-cart-item.entity';
import { UserFavorite } from '../favorites/entities/user-favorite.entity';

@Injectable()
export class ArtistsService {
  private readonly logger = new Logger(ArtistsService.name);

  constructor(
    @InjectRepository(Artist)
    private readonly artistsRepository: Repository<Artist>,
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async apply(userId: number, dto: ApplyArtistDto): Promise<Artist> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException(
        'Super-admin accounts cannot apply as artists',
      );
    }

    if (user.role === UserRole.ARTIST) {
      throw new ConflictException('You are already an approved artist');
    }

    const existing = await this.findByUserId(userId);

    if (existing?.status === ArtistStatus.PENDING) {
      throw new ConflictException('You already have a pending application');
    }

    if (existing?.status === ArtistStatus.APPROVED) {
      throw new ConflictException('You are already an approved artist');
    }

    if (existing?.status === ArtistStatus.SUSPENDED) {
      throw new BadRequestException(
        'Your artist account is suspended. Contact support.',
      );
    }

    const slug = await this.generateUniqueSlug(dto.displayName, existing?.id);
    const applicationData = this.mapApplicationDto(dto);

    if (existing?.status === ArtistStatus.REJECTED) {
      Object.assign(existing, applicationData, {
        slug,
        status: ArtistStatus.PENDING,
        rejectionReason: null,
        reviewedAt: null,
        reviewedById: null,
      });
      const saved = await this.artistsRepository.save(existing);
      const artist = await this.findOneForAdmin(saved.id);
      await this.notifySuperAdminsOfApplication(artist, user);
      await this.notifyApplicantOfSubmission(artist, user);
      return artist;
    }

    const artist = this.artistsRepository.create({
      ...applicationData,
      slug,
      userId,
      status: ArtistStatus.PENDING,
    });

    const saved = await this.artistsRepository.save(artist);
    const withUser = await this.findOneForAdmin(saved.id);
    await this.notifySuperAdminsOfApplication(withUser, user);
    await this.notifyApplicantOfSubmission(withUser, user);
    return withUser;
  }

  async findApprovedByUserId(userId: number): Promise<Artist | null> {
    return this.artistsRepository.findOne({
      where: { userId, status: ArtistStatus.APPROVED },
      relations: ['user'],
    });
  }

  async findByUserId(userId: number): Promise<Artist | null> {
    return this.artistsRepository.findOne({
      where: { userId },
      relations: ['user'],
    });
  }

  async findPlatformArtist(): Promise<Artist | null> {
    return this.artistsRepository.findOne({
      where: { isPlatform: true },
    });
  }

  async ensurePlatformArtist(
    displayName: string,
    slug: string,
    description: string,
  ): Promise<Artist> {
    const existing = await this.findPlatformArtist();
    if (existing) {
      return existing;
    }

    const artist = this.artistsRepository.create({
      displayName,
      slug,
      description,
      userId: null,
      isPlatform: true,
      status: ArtistStatus.APPROVED,
      portfolioUrl: null,
      logo: null,
      coverImage: null,
    });

    return this.artistsRepository.save(artist);
  }

  async findApprovedBySlug(slug: string): Promise<Artist | null> {
    return this.artistsRepository.findOne({
      where: { slug, status: ArtistStatus.APPROVED },
    });
  }

  async findAllForAdmin(status?: ArtistStatus): Promise<Artist[]> {
    return this.artistsRepository.find({
      where: status ? { status } : {},
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOneForAdmin(id: number): Promise<Artist> {
    const artist = await this.artistsRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!artist) {
      throw new NotFoundException(`Artist with ID ${id} not found`);
    }

    return artist;
  }

  async findByIdWithUser(id: number): Promise<Artist | null> {
    return this.artistsRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async approve(id: number, reviewerId: number): Promise<Artist> {
    const artist = await this.findOneForAdmin(id);

    if (artist.status === ArtistStatus.APPROVED) {
      throw new BadRequestException('Artist is already approved');
    }

    if (artist.status === ArtistStatus.SUSPENDED) {
      throw new BadRequestException(
        'Suspended artists must be reactivated before approval',
      );
    }

    const queryRunner =
      this.artistsRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      artist.status = ArtistStatus.APPROVED;
      artist.rejectionReason = null;
      artist.reviewedAt = new Date();
      artist.reviewedById = reviewerId;

      await queryRunner.manager.save(artist);
      await queryRunner.manager.update(
        User,
        { id: artist.userId },
        { role: UserRole.ARTIST },
      );
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    const approved = await this.findOneForAdmin(id);
    if (approved.user) {
      await this.notifyApplicantOfApproval(approved, approved.user);
    }
    return approved;
  }

  async reject(
    id: number,
    reviewerId: number,
    reason: string,
  ): Promise<Artist> {
    const artist = await this.findOneForAdmin(id);

    if (artist.status === ArtistStatus.APPROVED) {
      throw new BadRequestException(
        'Approved artists cannot be rejected. Suspend the account instead.',
      );
    }

    if (artist.status === ArtistStatus.REJECTED) {
      throw new BadRequestException('Artist application is already rejected');
    }

    artist.status = ArtistStatus.REJECTED;
    artist.rejectionReason = reason.trim();
    artist.reviewedAt = new Date();
    artist.reviewedById = reviewerId;

    const saved = await this.artistsRepository.save(artist);
    const rejected = await this.findOneForAdmin(saved.id);
    if (rejected.user) {
      await this.notifyApplicantOfRejection(rejected, rejected.user);
    }
    return rejected;
  }

  async suspend(
    id: number,
    reviewerId: number,
    reason: string,
  ): Promise<Artist> {
    const artist = await this.findOneForAdmin(id);

    if (artist.status !== ArtistStatus.APPROVED) {
      throw new BadRequestException('Only approved artists can be suspended');
    }

    const queryRunner =
      this.artistsRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      artist.status = ArtistStatus.SUSPENDED;
      artist.suspensionReason = reason.trim();
      artist.suspensionNoticeDismissedAt = null;
      artist.reviewedAt = new Date();
      artist.reviewedById = reviewerId;

      await queryRunner.manager.save(artist);
      await queryRunner.manager.update(
        User,
        { id: artist.userId },
        { role: UserRole.CLIENT },
      );
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    const suspended = await this.findOneForAdmin(id);
    if (suspended.user) {
      await this.notifyArtistOfSuspension(suspended, suspended.user);
    }
    return suspended;
  }

  async reactivate(id: number, reviewerId: number): Promise<Artist> {
    const artist = await this.findOneForAdmin(id);

    if (artist.status !== ArtistStatus.SUSPENDED) {
      throw new BadRequestException('Only suspended artists can be reactivated');
    }

    const queryRunner =
      this.artistsRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      artist.status = ArtistStatus.APPROVED;
      artist.suspensionReason = null;
      artist.suspensionNoticeDismissedAt = null;
      artist.lastReactivatedAt = new Date();
      artist.reactivationNoticeDismissedAt = null;
      artist.reviewedAt = new Date();
      artist.reviewedById = reviewerId;

      await queryRunner.manager.save(artist);
      await queryRunner.manager.update(
        User,
        { id: artist.userId },
        { role: UserRole.ARTIST },
      );
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    const reactivated = await this.findOneForAdmin(id);
    if (reactivated.user) {
      await this.notifyArtistOfReactivation(reactivated, reactivated.user);
    }
    return reactivated;
  }

  async dismissSuspensionNotice(userId: number): Promise<Artist> {
    const artist = await this.findByUserId(userId);

    if (!artist) {
      throw new NotFoundException('Artist application not found');
    }

    if (artist.status !== ArtistStatus.SUSPENDED) {
      throw new BadRequestException('Only suspended artists can dismiss this notice');
    }

    artist.suspensionNoticeDismissedAt = new Date();
    await this.artistsRepository.save(artist);

    return artist;
  }

  async dismissReactivationNotice(userId: number): Promise<Artist> {
    const artist = await this.findByUserId(userId);

    if (!artist) {
      throw new NotFoundException('Artist application not found');
    }

    if (!artist.lastReactivatedAt) {
      throw new BadRequestException('No reactivation notice to dismiss');
    }

    artist.reactivationNoticeDismissedAt = new Date();
    await this.artistsRepository.save(artist);

    return artist;
  }

  async deleteAccountByAdmin(id: number): Promise<void> {
    const artist = await this.findOneForAdmin(id);

    if (artist.isPlatform) {
      throw new BadRequestException('Platform artist cannot be deleted');
    }

    const userId = artist.userId;
    if (userId) {
      const user = await this.usersService.findOne(userId);
      if (!user) {
        throw new NotFoundException('Linked user account not found');
      }
      if (user.role === UserRole.SUPER_ADMIN) {
        throw new BadRequestException('Super-admin accounts cannot be deleted');
      }
    }

    const platformArtist = await this.findPlatformArtist();
    if (!platformArtist) {
      throw new BadRequestException('Platform artist is not configured');
    }

    const queryRunner =
      this.artistsRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.update(
        OrderItem,
        { artistId: artist.id },
        { artistId: platformArtist.id },
      );

      const products = await queryRunner.manager.find(Product, {
        where: { artistId: artist.id },
        select: ['id'],
      });
      const productIds = products.map((product) => product.id);

      if (productIds.length) {
        await queryRunner.manager.delete(UserCartItem, {
          productId: In(productIds),
        });
        await queryRunner.manager.delete(UserFavorite, {
          productId: In(productIds),
        });
        await queryRunner.manager.delete(Product, { artistId: artist.id });
      }

      await queryRunner.manager.delete(Artist, { id: artist.id });

      if (userId) {
        await queryRunner.manager.delete(User, { id: userId });
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        'Failed to delete artist account',
        error instanceof Error ? error.stack : String(error),
      );
      throw new BadRequestException('Failed to delete artist account');
    } finally {
      await queryRunner.release();
    }
  }

  private async notifySuperAdminsOfApplication(
    artist: Artist,
    user: User,
  ): Promise<void> {
    try {
      const recipients = await this.usersService.findSuperAdminEmails();
      if (!recipients.length) {
        this.logger.warn(
          'No super-admin emails found for artist application notification',
        );
        return;
      }

      const frontendBase =
        this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
      const applicantName =
        `${artist.artistFirstName || user.first_name} ${artist.artistLastName || user.last_name}`.trim();
      const payload = {
        applicantName,
        applicantEmail: artist.contactEmail || user.email,
        applicantPhone: artist.contactPhone ?? user.phone ?? null,
        artistFirstName: artist.artistFirstName,
        artistLastName: artist.artistLastName,
        companyCui: artist.companyCui,
        companyLegalName: artist.companyLegalName,
        displayName: artist.displayName,
        contactEmail: artist.contactEmail,
        contactPhone: artist.contactPhone,
        portfolioUrl: artist.portfolioUrl,
        adminUrl: `${frontendBase}/admin/artisti/${artist.id}`,
      };

      await Promise.all(
        recipients.map((email) =>
          this.emailService.sendArtistApplicationNotification(email, payload),
        ),
      );
    } catch (error) {
      this.logger.error(
        'Failed to send artist application notification email',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private async notifyApplicantOfSubmission(
    artist: Artist,
    user: User,
  ): Promise<void> {
    try {
      await this.emailService.sendArtistApplicationReceived(
        artist.contactEmail || user.email,
        {
          firstName: artist.artistFirstName || user.first_name,
          artistFirstName: artist.artistFirstName,
          artistLastName: artist.artistLastName,
          companyCui: artist.companyCui,
          companyLegalName: artist.companyLegalName,
          displayName: artist.displayName,
          contactEmail: artist.contactEmail,
          contactPhone: artist.contactPhone,
          portfolioUrl: artist.portfolioUrl,
        },
      );
    } catch (error) {
      this.logger.error(
        'Failed to send artist application confirmation email',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private async notifyApplicantOfApproval(
    artist: Artist,
    user: User,
  ): Promise<void> {
    try {
      const frontendBase =
        this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
      await this.emailService.sendArtistApplicationApproved(user.email, {
        firstName: user.first_name,
        displayName: artist.displayName,
        panelUrl: `${frontendBase}/admin`,
      });
    } catch (error) {
      this.logger.error(
        'Failed to send artist approval email',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private async notifyApplicantOfRejection(
    artist: Artist,
    user: User,
  ): Promise<void> {
    try {
      const frontendBase =
        this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
      await this.emailService.sendArtistApplicationRejected(user.email, {
        firstName: user.first_name,
        displayName: artist.displayName,
        rejectionReason: artist.rejectionReason || 'Nu a fost specificat un motiv.',
        reapplyUrl: `${frontendBase}/vinde-cu-noi?reapply=1`,
      });
    } catch (error) {
      this.logger.error(
        'Failed to send artist rejection email',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private async notifyArtistOfSuspension(
    artist: Artist,
    user: User,
  ): Promise<void> {
    try {
      const frontendBase =
        this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
      const suspendedAt = (artist.reviewedAt ?? new Date()).toLocaleString(
        'ro-RO',
        { dateStyle: 'long', timeStyle: 'short' },
      );

      await this.emailService.sendArtistAccountSuspended(
        artist.contactEmail || user.email,
        {
          firstName: user.first_name,
          displayName: artist.displayName,
          suspensionReason:
            artist.suspensionReason || 'Nu a fost specificat un motiv.',
          suspendedAt,
          contactUrl: `${frontendBase}/contact`,
        },
      );
    } catch (error) {
      this.logger.error(
        'Failed to send artist suspension email',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private async notifyArtistOfReactivation(
    artist: Artist,
    user: User,
  ): Promise<void> {
    try {
      const frontendBase =
        this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
      const reactivatedAt = (artist.lastReactivatedAt ?? new Date()).toLocaleString(
        'ro-RO',
        { dateStyle: 'long', timeStyle: 'short' },
      );

      await this.emailService.sendArtistAccountReactivated(
        artist.contactEmail || user.email,
        {
          firstName: user.first_name,
          displayName: artist.displayName,
          reactivatedAt,
          panelUrl: `${frontendBase}/admin`,
        },
      );
    } catch (error) {
      this.logger.error(
        'Failed to send artist reactivation email',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private mapApplicationDto(dto: ApplyArtistDto) {
    const companyLegalName = dto.companyLegalName.trim();

    return {
      artistFirstName: dto.artistFirstName.trim(),
      artistLastName: dto.artistLastName.trim(),
      companyCui: dto.companyCui.replace(/\D/g, ''),
      companyLegalName,
      displayName: dto.displayName.trim(),
      contactEmail: dto.contactEmail.trim().toLowerCase(),
      contactPhone: dto.contactPhone?.trim() || null,
      portfolioUrl: dto.portfolioUrl?.trim() || null,
      description: companyLegalName,
    };
  }

  private async generateUniqueSlug(
    displayName: string,
    excludeArtistId?: number,
  ): Promise<string> {
    const baseSlug = slugify(displayName);

    if (!baseSlug) {
      throw new BadRequestException('Display name must contain valid characters');
    }

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.artistsRepository.findOne({ where: { slug } });
      if (!existing || existing.id === excludeArtistId) {
        return slug;
      }
      slug = `${baseSlug}-${counter}`;
      counter += 1;
    }
  }
}
