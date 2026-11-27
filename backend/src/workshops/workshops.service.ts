import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ArtistStatus } from '../common/enums/artist-status.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../users/entities/user.entity';
import { ArtistsService } from '../artists/artists.service';
import { CheckoutService } from '../checkout/checkout.service';
import { EmailService } from '../email/email.service';
import { slugify } from '../common/utils/slug.util';
import {
  NETOPIA_STATUS_CONFIRMED,
  NETOPIA_STATUS_PAID,
} from '../checkout/card-payment-match.util';
import { CreateWorkshopBookingDto } from './dto/create-workshop-booking.dto';
import { SaveWorkshopDto } from './dto/save-workshop.dto';
import { WorkshopBooking } from './entities/workshop-booking.entity';
import { Workshop } from './entities/workshop.entity';
import {
  WorkshopPaymentMethod,
  WorkshopPaymentStatus,
} from './enums/workshop-payment.enum';
import {
  assertChosenPayment,
  assertPaymentSetup,
  bookingHoldsSeats,
  occupiedSpots,
  type SeatBooking,
} from './workshop-booking.util';

const WORKSHOP_NOTIFY_PATH = '/workshops/ipn';

@Injectable()
export class WorkshopsService {
  private readonly logger = new Logger(WorkshopsService.name);

  constructor(
    @InjectRepository(Workshop)
    private readonly workshopsRepository: Repository<Workshop>,
    @InjectRepository(WorkshopBooking)
    private readonly bookingsRepository: Repository<WorkshopBooking>,
    private readonly artistsService: ArtistsService,
    private readonly checkoutService: CheckoutService,
    private readonly emailService: EmailService,
    private readonly dataSource: DataSource,
  ) {}

  async listPublic() {
    const workshops = await this.publishedWorkshops();
    return Promise.all(workshops.map((workshop) => this.toPublic(workshop)));
  }

  async getPublic(slug: string) {
    const workshop = await this.findPublishedBySlug(slug);
    return this.toPublic(workshop);
  }

  async listForAdmin(user: User) {
    const where =
      user.role === UserRole.SUPER_ADMIN
        ? {}
        : { artistId: (await this.ownedArtist(user)).id };
    const workshops = await this.workshopsRepository.find({
      where,
      relations: ['artist'],
      order: { startsAt: 'ASC' },
    });
    return Promise.all(workshops.map((workshop) => this.toAdmin(workshop)));
  }

  async getForAdmin(user: User, id: number) {
    const workshop = await this.requireOwned(user, id);
    const bookings = await this.bookingsRepository.find({
      where: { workshopId: workshop.id },
      order: { createdAt: 'DESC' },
    });
    return {
      ...(await this.toAdmin(workshop)),
      bookings: bookings.map((booking) => this.toBooking(booking)),
    };
  }

  async create(user: User, dto: SaveWorkshopDto) {
    this.assertSchedule(dto);
    assertPaymentSetup(dto.allowCard, dto.allowCash, Number(dto.fee));
    const artistId = await this.resolveArtistId(user, dto.artistId);
    const workshop = this.workshopsRepository.create({
      ...this.toColumns(dto),
      artistId,
      slug: await this.uniqueSlug(dto.title),
    });
    const saved = await this.workshopsRepository.save(workshop);
    return this.getForAdmin(user, saved.id);
  }

  async update(user: User, id: number, dto: SaveWorkshopDto) {
    this.assertSchedule(dto);
    assertPaymentSetup(dto.allowCard, dto.allowCash, Number(dto.fee));
    const workshop = await this.requireOwned(user, id);
    const used = await this.usedSpots(workshop.id);
    if (dto.capacity < used) {
      throw new BadRequestException(
        `Capacitatea nu poate fi mai mică decât locurile deja rezervate (${used}).`,
      );
    }
    Object.assign(workshop, this.toColumns(dto));
    await this.workshopsRepository.save(workshop);
    return this.getForAdmin(user, workshop.id);
  }

  async reserveSeats(user: User, id: number, spots: number) {
    const workshop = await this.requireOwned(user, id);
    await this.dataSource.transaction(async (manager) => {
      await manager.query(`SELECT id FROM "workshop" WHERE id = $1 FOR UPDATE`, [
        workshop.id,
      ]);
      const existing = await manager.find(WorkshopBooking, {
        where: { workshopId: workshop.id },
      });
      const used = occupiedSpots(this.asSeatBookings(existing), new Date());
      if (used + spots > workshop.capacity) {
        throw new BadRequestException('Nu mai sunt suficiente locuri.');
      }
      const created = manager.create(WorkshopBooking, {
        publicCode: `TMP-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        workshopId: workshop.id,
        userId: user.id,
        spots,
        customerFirstName: user.first_name.trim() || 'Artist',
        customerLastName: user.last_name.trim() || 'Rezervare',
        customerEmail: user.email.trim().toLowerCase(),
        customerPhone: user.phone?.trim() || '-',
        paymentMethod: WorkshopPaymentMethod.COMPLIMENTARY,
        paymentStatus: WorkshopPaymentStatus.PAID,
        amount: '0.00',
        netopiaNtpId: null,
        confirmationSent: true,
      });
      const saved = await manager.save(created);
      saved.publicCode = `ATL-${saved.id}`;
      await manager.save(saved);
    });
    return this.getForAdmin(user, id);
  }

  async updateReservation(user: User, id: number, bookingId: number, spots: number) {
    const workshop = await this.requireOwned(user, id);
    await this.dataSource.transaction(async (manager) => {
      await manager.query(`SELECT id FROM "workshop" WHERE id = $1 FOR UPDATE`, [
        workshop.id,
      ]);
      const booking = await manager.findOne(WorkshopBooking, {
        where: { id: bookingId, workshopId: workshop.id },
      });
      if (!booking) {
        throw new NotFoundException('Rezervarea nu a fost găsită.');
      }
      if (booking.paymentMethod !== WorkshopPaymentMethod.COMPLIMENTARY) {
        throw new BadRequestException('Doar rezervările fără plată pot fi modificate.');
      }
      if (spots === booking.spots) {
        return;
      }
      if (spots === 0) {
        await manager.remove(booking);
        return;
      }
      const existing = await manager.find(WorkshopBooking, {
        where: { workshopId: workshop.id },
      });
      const used = occupiedSpots(this.asSeatBookings(existing), new Date());
      if (used - booking.spots + spots > workshop.capacity) {
        throw new BadRequestException('Nu mai sunt suficiente locuri.');
      }
      booking.spots = spots;
      await manager.save(booking);
    });
    return this.getForAdmin(user, id);
  }

  async remove(user: User, id: number) {
    const workshop = await this.requireOwned(user, id);
    const bookings = await this.bookingsRepository.find({
      where: { workshopId: workshop.id },
    });
    const recipients = bookings.filter(
      (booking) =>
        booking.paymentMethod !== WorkshopPaymentMethod.COMPLIMENTARY &&
        bookingHoldsSeats(this.asSeatBookings([booking])[0], new Date()),
    );
    await this.workshopsRepository.remove(workshop);
    await this.notifyCancellation(recipients, workshop);
    return { deleted: true };
  }

  async book(slug: string, dto: CreateWorkshopBookingDto, userId?: number) {
    const workshop = await this.findPublishedBySlug(slug);
    assertChosenPayment(workshop.allowCard, workshop.allowCash, dto.paymentMethod);
    if (new Date(workshop.startsAt).getTime() <= Date.now()) {
      throw new BadRequestException('Înscrierile pentru acest atelier s-au închis.');
    }
    const fee = Number(workshop.fee);
    const amount = Number((fee * dto.spots).toFixed(2));
    if (dto.paymentMethod === WorkshopPaymentMethod.CARD && amount <= 0) {
      throw new BadRequestException('Plata cu cardul necesită o taxă mai mare decât 0.');
    }

    const booking = await this.dataSource.transaction(async (manager) => {
      await manager.query(`SELECT id FROM "workshop" WHERE id = $1 FOR UPDATE`, [
        workshop.id,
      ]);
      const existing = await manager.find(WorkshopBooking, {
        where: { workshopId: workshop.id },
      });
      const used = occupiedSpots(this.asSeatBookings(existing), new Date());
      if (used + dto.spots > workshop.capacity) {
        throw new BadRequestException('Nu mai sunt suficiente locuri.');
      }
      const created = manager.create(WorkshopBooking, {
        publicCode: `TMP-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        workshopId: workshop.id,
        userId: userId ?? null,
        spots: dto.spots,
        customerFirstName: dto.firstName.trim(),
        customerLastName: dto.lastName.trim(),
        customerEmail: dto.email.trim().toLowerCase(),
        customerPhone: dto.phone.trim(),
        paymentMethod: dto.paymentMethod,
        paymentStatus:
          dto.paymentMethod === WorkshopPaymentMethod.CASH
            ? WorkshopPaymentStatus.AWAITING_CASH
            : WorkshopPaymentStatus.PENDING,
        amount: amount.toFixed(2),
        netopiaNtpId: null,
        confirmationSent: false,
      });
      const saved = await manager.save(created);
      saved.publicCode = `ATL-${saved.id}`;
      return manager.save(saved);
    });

    if (booking.paymentMethod === WorkshopPaymentMethod.CASH) {
      await this.sendConfirmation(booking, workshop);
      return {
        code: booking.publicCode,
        paymentMethod: booking.paymentMethod,
        paymentStatus: booking.paymentStatus,
      };
    }

    try {
      const payment = await this.checkoutService.startExternalCardPayment({
        orderId: booking.publicCode,
        description: `Rezervare atelier ${booking.publicCode}`,
        amountRon: amount,
        productName: workshop.title.slice(0, 120),
        productCode: `atelier-${workshop.id}`,
        notifyPath: WORKSHOP_NOTIFY_PATH,
        customer: {
          email: booking.customerEmail,
          phone: booking.customerPhone,
          firstName: booking.customerFirstName,
          lastName: booking.customerLastName,
          city: 'Bucuresti',
          county: 'Bucuresti',
          street: workshop.location.slice(0, 180),
          postalCode: '010011',
        },
        successUrl: this.withCode(
          this.storefrontUrl(dto.successUrl, '/ateliere/confirmare'),
          booking.publicCode,
        ),
        cancelUrl: this.storefrontUrl(dto.cancelUrl, `/ateliere/${workshop.slug}`),
      });
      if (!payment.ntpId) {
        throw new BadRequestException(
          'Plata cu cardul nu a putut fi pornită. Încearcă din nou.',
        );
      }
      booking.netopiaNtpId = payment.ntpId;
      await this.bookingsRepository.save(booking);
      return {
        code: booking.publicCode,
        paymentMethod: booking.paymentMethod,
        paymentStatus: booking.paymentStatus,
        url: payment.url,
      };
    } catch (error) {
      booking.paymentStatus = WorkshopPaymentStatus.FAILED;
      await this.bookingsRepository.save(booking);
      throw error;
    }
  }

  async getBookingStatus(code: string) {
    const booking = await this.bookingsRepository.findOne({
      where: { publicCode: code },
      relations: ['workshop'],
    });
    if (!booking) {
      throw new NotFoundException('Rezervarea nu a fost găsită.');
    }
    if (
      booking.paymentMethod === WorkshopPaymentMethod.CARD &&
      booking.paymentStatus === WorkshopPaymentStatus.PENDING
    ) {
      await this.confirmCardIfPaid(booking);
    }
    return {
      code: booking.publicCode,
      paymentMethod: booking.paymentMethod,
      paymentStatus: booking.paymentStatus,
      spots: booking.spots,
      amount: Number(booking.amount),
      workshopTitle: booking.workshop?.title || '',
    };
  }

  async handleCardIpn(
    verificationToken: string,
    rawData: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const verified = await this.checkoutService.verifyNetopiaNotification(
      verificationToken,
      rawData,
    );
    const reportedOrder = payload.order as { orderID?: string } | undefined;
    const reportedPayment = payload.payment as { ntpID?: string } | undefined;
    const code = reportedOrder?.orderID?.trim();
    if (!code) {
      throw new BadRequestException('IPN Netopia fără număr de rezervare.');
    }
    const booking = await this.bookingsRepository.findOne({
      where: { publicCode: code },
      relations: ['workshop'],
    });
    if (!booking || booking.paymentMethod !== WorkshopPaymentMethod.CARD) {
      throw new BadRequestException('Rezervarea din IPN nu există.');
    }
    const paid = await this.checkoutService.externalCardPaymentIsPaid(
      {
        orderId: booking.publicCode,
        totalRon: booking.amount,
        netopiaNtpId: booking.netopiaNtpId,
      },
      reportedPayment?.ntpID,
    );
    if (paid) {
      await this.markCardPaid(booking);
      return;
    }
    if (!verified.signatureOk) {
      throw new BadRequestException(
        verified.errorMessage || 'Verificarea IPN Netopia a eșuat.',
      );
    }
    if (
      verified.status === NETOPIA_STATUS_PAID ||
      verified.status === NETOPIA_STATUS_CONFIRMED
    ) {
      this.logger.warn(
        `IPN semnat pentru ${code}, dar statusul Netopia nu confirmă plata.`,
      );
    }
  }

  private async confirmCardIfPaid(booking: WorkshopBooking): Promise<void> {
    const paid = await this.checkoutService.externalCardPaymentIsPaid({
      orderId: booking.publicCode,
      totalRon: booking.amount,
      netopiaNtpId: booking.netopiaNtpId,
    });
    if (paid) {
      await this.markCardPaid(booking);
    }
  }

  private async markCardPaid(booking: WorkshopBooking): Promise<void> {
    if (booking.paymentStatus !== WorkshopPaymentStatus.PAID) {
      booking.paymentStatus = WorkshopPaymentStatus.PAID;
      await this.bookingsRepository.save(booking);
    }
    if (!booking.confirmationSent) {
      const workshop =
        booking.workshop ||
        (await this.workshopsRepository.findOne({
          where: { id: booking.workshopId },
          relations: ['artist'],
        }));
      if (workshop) {
        await this.sendConfirmation(booking, workshop);
      }
    }
  }

  private async notifyCancellation(bookings: WorkshopBooking[], workshop: Workshop) {
    const when = new Intl.DateTimeFormat('ro-RO', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'Europe/Bucharest',
    }).format(new Date(workshop.startsAt));
    await Promise.all(
      bookings.map(async (booking) => {
        const cardRefund = booking.paymentMethod === WorkshopPaymentMethod.CARD;
        try {
          await this.emailService.sendWorkshopCancelledEmail(booking.customerEmail, {
            firstName: booking.customerFirstName,
            title: workshop.title,
            when,
            location: workshop.location,
            code: booking.publicCode,
            spots: booking.spots,
            cardRefund,
          });
        } catch (error) {
          this.logger.warn(
            `Email anulare ${booking.publicCode} eșuat: ${error instanceof Error ? error.message : 'unknown'}`,
          );
        }
      }),
    );
  }

  private async sendConfirmation(booking: WorkshopBooking, workshop: Workshop) {
    const artist = await this.artistsService.findByIdWithUser(workshop.artistId);
    const method =
      booking.paymentMethod === WorkshopPaymentMethod.CARD
        ? 'card'
        : 'numerar la locație';
    const status =
      booking.paymentStatus === WorkshopPaymentStatus.PAID
        ? 'plătită'
        : 'rezervată, de achitat la locație';
    const html = `
      <h2>Rezervare atelier ${this.escape(booking.publicCode)}</h2>
      <p><strong>${this.escape(workshop.title)}</strong></p>
      <p>Locuri: ${booking.spots}<br/>Total: ${booking.amount} RON<br/>Plată: ${method} (${status})</p>
      <p>${this.escape(booking.customerFirstName)} ${this.escape(booking.customerLastName)}<br/>
      ${this.escape(booking.customerEmail)}<br/>${this.escape(booking.customerPhone)}</p>
    `;
    try {
      await this.emailService.sendOrderNotificationEmail(
        booking.customerEmail,
        `Rezervare atelier ${booking.publicCode}`,
        html,
      );
      const artistEmail = artist?.contactEmail || artist?.user?.email;
      if (artistEmail) {
        await this.emailService.sendOrderNotificationEmail(
          artistEmail,
          `Rezervare nouă ${booking.publicCode}`,
          html,
        );
      }
      booking.confirmationSent = true;
      await this.bookingsRepository.save(booking);
    } catch (error) {
      this.logger.warn(`Email rezervare ${booking.publicCode} eșuat: ${error}`);
    }
  }

  private async publishedWorkshops(): Promise<Workshop[]> {
    return this.workshopsRepository
      .createQueryBuilder('workshop')
      .leftJoinAndSelect('workshop.artist', 'artist')
      .where('workshop.published = true')
      .andWhere('artist.status = :status', { status: ArtistStatus.APPROVED })
      .orderBy('workshop.startsAt', 'ASC')
      .getMany();
  }

  private async findPublishedBySlug(slug: string): Promise<Workshop> {
    const workshop = await this.workshopsRepository.findOne({
      where: { slug },
      relations: ['artist'],
    });
    if (
      !workshop?.published ||
      workshop.artist?.status !== ArtistStatus.APPROVED
    ) {
      throw new NotFoundException('Atelierul nu a fost găsit.');
    }
    return workshop;
  }

  private async requireOwned(user: User, id: number): Promise<Workshop> {
    const workshop = await this.workshopsRepository.findOne({
      where: { id },
      relations: ['artist'],
    });
    if (!workshop) {
      throw new NotFoundException('Atelierul nu a fost găsit.');
    }
    if (user.role === UserRole.SUPER_ADMIN) {
      return workshop;
    }
    const artist = await this.ownedArtist(user);
    if (workshop.artistId !== artist.id) {
      throw new ForbiddenException('Poți gestiona doar atelierele tale.');
    }
    return workshop;
  }

  private async ownedArtist(user: User) {
    if (user.role !== UserRole.ARTIST) {
      throw new ForbiddenException('Doar un artist poate gestiona atelierele.');
    }
    const artist = await this.artistsService.findApprovedByUserId(user.id);
    if (!artist) {
      throw new ForbiddenException('Contul de artist nu este aprobat.');
    }
    return artist;
  }

  private async resolveArtistId(user: User, artistId?: number): Promise<number> {
    if (user.role === UserRole.SUPER_ADMIN) {
      if (!artistId) {
        throw new BadRequestException('Alege artistul care ține atelierul.');
      }
      const artist = await this.artistsService.findByIdWithUser(artistId);
      if (!artist || artist.status !== ArtistStatus.APPROVED) {
        throw new BadRequestException('Artistul selectat nu este aprobat.');
      }
      return artist.id;
    }
    return (await this.ownedArtist(user)).id;
  }

  private toColumns(dto: SaveWorkshopDto) {
    return {
      title: dto.title.trim(),
      description: dto.description.trim(),
      fee: Number(dto.fee).toFixed(2),
      allowCard: dto.allowCard,
      allowCash: dto.allowCash,
      startsAt: new Date(dto.startsAt),
      endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
      location: dto.location.trim(),
      capacity: dto.capacity,
      published: dto.published,
    };
  }

  private assertSchedule(dto: SaveWorkshopDto) {
    const start = new Date(dto.startsAt);
    if (Number.isNaN(start.getTime())) {
      throw new BadRequestException('Data atelierului este invalidă.');
    }
    if (dto.endsAt) {
      const end = new Date(dto.endsAt);
      if (Number.isNaN(end.getTime()) || end.getTime() <= start.getTime()) {
        throw new BadRequestException('Ora de final trebuie să fie după ora de start.');
      }
    }
  }

  private async uniqueSlug(title: string): Promise<string> {
    const base = slugify(title) || 'atelier';
    let slug = base;
    let index = 2;
    while (await this.workshopsRepository.findOne({ where: { slug } })) {
      slug = `${base}-${index}`;
      index += 1;
    }
    return slug;
  }

  private asSeatBookings(bookings: WorkshopBooking[]): SeatBooking[] {
    return bookings.map((booking) => ({
      spots: booking.spots,
      status: booking.paymentStatus,
      paymentMethod: booking.paymentMethod,
      createdAt: booking.createdAt,
    }));
  }

  private async usedSpots(workshopId: number): Promise<number> {
    const bookings = await this.bookingsRepository.find({ where: { workshopId } });
    return occupiedSpots(this.asSeatBookings(bookings), new Date());
  }

  private async toPublic(workshop: Workshop) {
    const spotsLeft = Math.max(0, workshop.capacity - (await this.usedSpots(workshop.id)));
    return {
      id: workshop.id,
      slug: workshop.slug,
      title: workshop.title,
      description: workshop.description,
      fee: Number(workshop.fee),
      allowCard: workshop.allowCard,
      allowCash: workshop.allowCash,
      startsAt: workshop.startsAt,
      endsAt: workshop.endsAt,
      location: workshop.location,
      capacity: workshop.capacity,
      spotsLeft,
      artist: {
        id: workshop.artist.id,
        displayName: workshop.artist.displayName,
        slug: workshop.artist.slug,
      },
    };
  }

  private async toAdmin(workshop: Workshop) {
    const bookings = await this.bookingsRepository.find({
      where: { workshopId: workshop.id },
    });
    return {
      ...(await this.toPublic({
        ...workshop,
        published: true,
        artist: workshop.artist,
      } as Workshop)),
      artistId: workshop.artistId,
      published: workshop.published,
      spotsLeft: Math.max(
        0,
        workshop.capacity - occupiedSpots(this.asSeatBookings(bookings), new Date()),
      ),
      bookingsCount: bookings.filter((booking) =>
        booking.paymentStatus === WorkshopPaymentStatus.PAID ||
        booking.paymentStatus === WorkshopPaymentStatus.AWAITING_CASH,
      ).length,
    };
  }

  private toBooking(booking: WorkshopBooking) {
    return {
      id: booking.id,
      code: booking.publicCode,
      spots: booking.spots,
      customerName: `${booking.customerFirstName} ${booking.customerLastName}`,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      paymentMethod: booking.paymentMethod,
      paymentStatus: booking.paymentStatus,
      amount: Number(booking.amount),
      createdAt: booking.createdAt,
    };
  }

  private storefrontUrl(pathOrUrl: string | undefined, fallbackPath: string): string {
    const frontend = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(
      /\/$/,
      '',
    );
    const fallback = `${frontend}${fallbackPath}`;
    if (!pathOrUrl) {
      return fallback;
    }
    try {
      const url = new URL(pathOrUrl, frontend);
      if (url.origin !== new URL(frontend).origin) {
        return fallback;
      }
      return url.toString();
    } catch {
      return fallback;
    }
  }

  private withCode(url: string, code: string): string {
    const next = new URL(url);
    next.searchParams.set('code', code);
    return next.toString();
  }

  private escape(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
