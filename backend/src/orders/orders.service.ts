import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Order, OrderBillingDetails } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import {
  OrderItemStatus,
  OrderPaymentStatus,
  PaymentMethod,
} from '../common/enums/order-status.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../users/entities/user.entity';
import { ArtistsService } from '../artists/artists.service';
import { ArtistStatus } from '../common/enums/artist-status.enum';
import {
  applyActiveOrdersFilter,
  applyArchivedOrdersFilter,
  TERMINAL_ORDER_ITEM_STATUSES,
} from '../common/utils/order-archive.util';
import { formatPublicOrderNumber } from './utils/public-order-number.util';
import {
  DASHBOARD_LAST_MONTHS,
  DASHBOARD_MONTH_COUNT,
  SalesPoint,
  daysInMonth,
  fillSalesPoints,
  parseSalesBucket,
  recentMonthKeys,
  roundMoney,
} from './utils/artist-sales-stats.util';

type DashboardArtist = {
  id: number;
  displayName: string;
};

export type DashboardRecentOrder = {
  id: number;
  publicOrderNumber: string;
  createdAt: string;
  customerName: string;
  mugsSold: number;
  totalRon: number;
  statuses: string[];
};

export type DashboardRangeId =
  | 'previousMonth'
  | 'currentMonth'
  | 'last3'
  | 'lastYear';

export type SalesSlice = {
  mugsSold: number;
  totalValueRon: number;
  customersCount: number;
  points: SalesPoint[];
  recentOrders: DashboardRecentOrder[];
};

export type ArtistSalesRanges = {
  artistId: number;
  displayName: string;
  ranges: Record<DashboardRangeId, SalesSlice>;
};

export type ArtistSalesDashboard = {
  artists: DashboardArtist[];
  canFilterArtists: boolean;
  ranges: Record<DashboardRangeId, SalesSlice>;
  byArtist: ArtistSalesRanges[];
};

type SalesWindow =
  | { kind: 'month'; month: string }
  | { kind: 'months'; count: number };

export type AdminOrdersFilter = {
  paymentStatus?: OrderPaymentStatus;
  itemStatus?: OrderItemStatus;
  artistId?: number;
  userId?: number;
  archived?: boolean;
};

export type OrderLineInput = {
  productId: number;
  artistId: number;
  artistDisplayName: string;
  title: string;
  quantity: number;
  unitPriceRon: number;
  lineTotalRon: number;
  imageUrl?: string;
};

export type CreateOrderInput = {
  userId?: number | null;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    county: string;
    city: string;
    street: string;
    postalCode: string;
    recipientName?: string;
    recipientPhone?: string;
  };
  billingDetails?: OrderBillingDetails | null;
  customerNote?: string | null;
  items: OrderLineInput[];
  subtotalRon: number;
  deliveryFeeRon: number;
  cashOperationalFeeRon: number;
  totalRon: number;
};

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepository: Repository<OrderItem>,
    private readonly artistsService: ArtistsService,
    private readonly dataSource: DataSource,
  ) {}

  async createCardOrder(input: CreateOrderInput): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const publicOrderNumber = await this.allocatePublicOrderNumber(manager);
      return this.persistOrder(manager, {
        ...input,
        paymentMethod: PaymentMethod.CARD,
        paymentStatus: OrderPaymentStatus.PENDING,
        publicOrderNumber,
      });
    });
  }

  async markCardOrderPaid(publicOrderNumber: string): Promise<Order | null> {
    const order = await this.ordersRepository.findOne({
      where: { publicOrderNumber },
      relations: ['items'],
    });

    if (!order) {
      return null;
    }

    if (order.paymentStatus === OrderPaymentStatus.PAID) {
      return order;
    }

    order.paymentStatus = OrderPaymentStatus.PAID;
    return this.ordersRepository.save(order);
  }

  async markStockFulfilled(publicOrderNumber: string): Promise<Order | null> {
    const order = await this.ordersRepository.findOne({
      where: { publicOrderNumber },
    });
    if (!order) {
      return null;
    }
    if (order.stockFulfilledAt) {
      return order;
    }
    order.stockFulfilledAt = new Date();
    return this.ordersRepository.save(order);
  }

  async markConfirmationSent(publicOrderNumber: string): Promise<Order | null> {
    const order = await this.ordersRepository.findOne({
      where: { publicOrderNumber },
    });
    if (!order) {
      return null;
    }
    if (order.confirmationSentAt) {
      return order;
    }
    order.confirmationSentAt = new Date();
    return this.ordersRepository.save(order);
  }

  async updateNetopiaNtpId(
    publicOrderNumber: string,
    netopiaNtpId: string,
  ): Promise<Order | null> {
    const order = await this.ordersRepository.findOne({
      where: { publicOrderNumber },
    });
    if (!order) {
      return null;
    }
    order.netopiaNtpId = netopiaNtpId;
    return this.ordersRepository.save(order);
  }

  async findByPublicOrderNumber(
    publicOrderNumber: string,
  ): Promise<Order | null> {
    return this.ordersRepository.findOne({
      where: { publicOrderNumber },
      relations: ['items', 'items.artist'],
    });
  }

  async getArtistSalesDashboard(
    user: User,
    artistIdInput?: number,
  ): Promise<ArtistSalesDashboard> {
    const months = recentMonthKeys();
    const currentMonth = months[months.length - 1];
    const previousMonth = months[months.length - 2];
    const ranges: Array<{
      id: DashboardRangeId;
      keys: string[];
      window: SalesWindow;
      bucket: 'day' | 'month';
    }> = [
      {
        id: 'previousMonth',
        keys: daysInMonth(previousMonth),
        window: { kind: 'month', month: previousMonth },
        bucket: 'day',
      },
      {
        id: 'currentMonth',
        keys: daysInMonth(currentMonth),
        window: { kind: 'month', month: currentMonth },
        bucket: 'day',
      },
      {
        id: 'last3',
        keys: recentMonthKeys(new Date(), DASHBOARD_LAST_MONTHS),
        window: { kind: 'months', count: DASHBOARD_LAST_MONTHS },
        bucket: 'month',
      },
      {
        id: 'lastYear',
        keys: recentMonthKeys(new Date(), DASHBOARD_MONTH_COUNT),
        window: { kind: 'months', count: DASHBOARD_MONTH_COUNT },
        bucket: 'month',
      },
    ];

    const artists = await this.resolveDashboardArtists(user);
    const canFilterArtists = user.role === UserRole.SUPER_ADMIN;
    const selected = this.selectDashboardArtist(user, artists, artistIdInput);
    const artistIds = canFilterArtists
      ? artists.map((artist) => artist.id)
      : selected
        ? [selected.id]
        : [];
    const emptyRanges = this.packRanges(
      ranges.map((range) => this.emptySalesSlice(range.keys)),
    );
    if (artistIds.length === 0) {
      return {
        artists: canFilterArtists ? artists : [],
        canFilterArtists,
        ranges: emptyRanges,
        byArtist: [],
      };
    }

    const combined = await Promise.all(
      ranges.map((range) =>
        this.loadSalesSlice(artistIds, range.keys, range.window, range.bucket),
      ),
    );
    const byArtist = canFilterArtists
      ? await this.loadArtistRangeSets(artists, ranges)
      : [];

    return {
      artists: canFilterArtists ? artists : selected ? [selected] : [],
      canFilterArtists,
      ranges: this.packRanges(combined),
      byArtist,
    };
  }

  async findForUser(userId: number): Promise<Order[]> {
    return this.ordersRepository.find({
      where: { userId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOneForUser(userId: number, orderId: number): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId, userId },
      relations: ['items', 'items.artist'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async findAllForAdmin(filters: AdminOrdersFilter = {}): Promise<Order[]> {
    const qb = this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'item')
      .leftJoinAndSelect('item.artist', 'artist')
      .orderBy('order.createdAt', 'DESC');

    if (filters.paymentStatus) {
      qb.andWhere('order.paymentStatus = :paymentStatus', {
        paymentStatus: filters.paymentStatus,
      });
    }

    if (filters.artistId) {
      qb.andWhere('item.artistId = :artistId', { artistId: filters.artistId });
    }

    if (filters.userId) {
      qb.andWhere('order.userId = :userId', { userId: filters.userId });
    }

    if (filters.itemStatus) {
      qb.andWhere('item.status = :itemStatus', {
        itemStatus: filters.itemStatus,
      });
    }

    if (filters.archived === true) {
      applyArchivedOrdersFilter(qb, filters.artistId);
    } else {
      applyActiveOrdersFilter(qb, filters.artistId);
    }

    qb.distinct(true);

    return qb.getMany();
  }

  async findForArtist(
    userId: number,
    filters: AdminOrdersFilter = {},
  ): Promise<Order[]> {
    const artist = await this.artistsService.findApprovedByUserId(userId);
    if (!artist) {
      throw new ForbiddenException('Approved artist profile required');
    }

    const qb = this.ordersRepository
      .createQueryBuilder('order')
      .innerJoinAndSelect('order.items', 'item', 'item.artistId = :artistId', {
        artistId: artist.id,
      })
      .orderBy('order.createdAt', 'DESC');

    if (filters.paymentStatus) {
      qb.andWhere('order.paymentStatus = :paymentStatus', {
        paymentStatus: filters.paymentStatus,
      });
    }

    if (filters.itemStatus) {
      qb.andWhere('item.status = :itemStatus', {
        itemStatus: filters.itemStatus,
      });
    }

    if (filters.archived === true) {
      applyArchivedOrdersFilter(qb, artist.id);
    } else {
      applyActiveOrdersFilter(qb, artist.id);
    }

    qb.distinct(true);

    return qb.getMany();
  }

  async findOneForAdmin(orderId: number): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'items.artist'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateItemStatus(
    user: User,
    itemId: number,
    status: OrderItemStatus,
  ): Promise<OrderItem> {
    const item = await this.orderItemsRepository.findOne({
      where: { id: itemId },
      relations: ['order', 'artist'],
    });

    if (!item) {
      throw new NotFoundException('Order item not found');
    }

    if (user.role === UserRole.ARTIST) {
      const artist = await this.artistsService.findApprovedByUserId(user.id);
      if (!artist || item.artistId !== artist.id) {
        throw new ForbiddenException(
          'You can only update your own order items',
        );
      }
    } else if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const previousStatus = item.status;
    item.status = status;
    item.statusUpdatedAt = new Date();
    if (previousStatus !== status) {
      item.isUnarchived = false;
      item.isManuallyArchived = false;
    }
    return this.orderItemsRepository.save(item);
  }

  async archiveOrder(user: User, orderId: number): Promise<Order> {
    const order = await this.findOneForAdmin(orderId);
    const items = await this.itemsManagedBy(
      user,
      order,
      'You can only archive your own orders',
    );

    if (this.areItemsArchived(items)) {
      throw new BadRequestException('Order is already archived');
    }

    for (const item of items) {
      item.isManuallyArchived = true;
      item.isUnarchived = false;
    }
    await this.orderItemsRepository.save(items);

    return this.findOneForAdmin(orderId);
  }

  async unarchiveOrder(user: User, orderId: number): Promise<Order> {
    const order = await this.findOneForAdmin(orderId);
    const items = await this.itemsManagedBy(
      user,
      order,
      'You can only unarchive your own orders',
    );

    if (!this.areItemsArchived(items)) {
      throw new BadRequestException('Order is not archived');
    }

    for (const item of items) {
      item.isManuallyArchived = false;
      item.isUnarchived = true;
    }
    await this.orderItemsRepository.save(items);

    return this.findOneForAdmin(orderId);
  }

  async updateCustomerNote(
    user: User,
    orderId: number,
    note: string | null,
  ): Promise<Order> {
    const order = await this.findOneForAdmin(orderId);
    await this.itemsManagedBy(
      user,
      order,
      'You can only update notes on your own orders',
    );
    order.customerNote = this.normalizeCustomerNote(note);
    return this.ordersRepository.save(order);
  }

  async deleteOrder(user: User, orderId: number): Promise<Order> {
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const order = await this.findOneForAdmin(orderId);
    await this.orderItemsRepository.delete({ orderId: order.id });
    await this.ordersRepository.delete(order.id);
    return order;
  }

  private normalizeCustomerNote(note?: string | null): string | null {
    if (typeof note !== 'string') {
      return null;
    }
    const trimmed = note.trim();
    if (!trimmed) {
      return null;
    }
    if (trimmed.length > 1000) {
      throw new BadRequestException(
        'Mentiunea poate avea maxim 1000 de caractere.',
      );
    }
    return trimmed;
  }

  private async itemsManagedBy(
    user: User,
    order: Order,
    artistMessage: string,
  ): Promise<OrderItem[]> {
    if (user.role === UserRole.ARTIST) {
      const artist = await this.artistsService.findApprovedByUserId(user.id);
      if (!artist) {
        throw new ForbiddenException('Approved artist profile required');
      }

      const items = (order.items ?? []).filter(
        (item) => item.artistId === artist.id,
      );
      if (!items.length) {
        throw new ForbiddenException(artistMessage);
      }
      return items;
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      return order.items ?? [];
    }

    throw new ForbiddenException('Insufficient permissions');
  }

  private areItemsArchived(items: OrderItem[]): boolean {
    if (!items.length) {
      return false;
    }

    return items.every((item) => this.isItemArchived(item));
  }

  private isItemArchived(item: OrderItem): boolean {
    if (item.isManuallyArchived) {
      return true;
    }

    return (
      (TERMINAL_ORDER_ITEM_STATUSES as readonly OrderItemStatus[]).includes(
        item.status,
      ) && !item.isUnarchived
    );
  }

  private async allocatePublicOrderNumber(
    manager: EntityManager,
  ): Promise<string> {
    await manager.query(`
      INSERT INTO "order_public_number" ("id", "value")
      SELECT 1, COALESCE((
        SELECT MAX(CAST(SUBSTRING("publicOrderNumber" FROM 5) AS integer))
        FROM "order"
        WHERE "publicOrderNumber" ~ '^MIL-[0-9]+$'
      ), 0)
      ON CONFLICT ("id") DO NOTHING
    `);
    const rows = await manager.query(
      `UPDATE "order_public_number" SET "value" = "value" + 1 WHERE "id" = 1 RETURNING "value"`,
    );
    const value = Number(rows[0]?.value);
    if (!Number.isInteger(value) || value < 1) {
      throw new BadRequestException('Could not allocate an order number');
    }
    return formatPublicOrderNumber(value);
  }

  private async persistOrder(
    manager: EntityManager,
    input: CreateOrderInput & {
      paymentMethod: PaymentMethod;
      paymentStatus: OrderPaymentStatus;
      publicOrderNumber: string;
    },
  ): Promise<Order> {
    if (!input.items.length) {
      throw new BadRequestException('Order must contain at least one item');
    }

    const order = manager.create(Order, {
      publicOrderNumber: input.publicOrderNumber,
      userId: input.userId ?? null,
      customerFirstName: input.customer.firstName.trim(),
      customerLastName: input.customer.lastName.trim(),
      customerEmail: input.customer.email.trim().toLowerCase(),
      customerPhone: input.customer.phone.trim(),
      deliveryCounty: input.customer.county.trim(),
      deliveryCity: input.customer.city.trim(),
      deliveryStreet: input.customer.street.trim(),
      deliveryPostalCode: input.customer.postalCode.trim(),
      deliveryRecipientName: input.customer.recipientName?.trim() || null,
      deliveryRecipientPhone: input.customer.recipientPhone?.trim() || null,
      customerNote: this.normalizeCustomerNote(input.customerNote),
      billingDetails: input.billingDetails ?? null,
      paymentMethod: input.paymentMethod,
      paymentStatus: input.paymentStatus,
      subtotalRon: input.subtotalRon,
      deliveryFeeRon: input.deliveryFeeRon,
      cashOperationalFeeRon: input.cashOperationalFeeRon,
      totalRon: input.totalRon,
      items: input.items.map((line) =>
        manager.create(OrderItem, {
          productId: line.productId,
          artistId: line.artistId,
          artistDisplayName: line.artistDisplayName,
          title: line.title,
          image: line.imageUrl ?? null,
          quantity: line.quantity,
          unitPriceRon: line.unitPriceRon,
          lineTotalRon: line.lineTotalRon,
          status: OrderItemStatus.PENDING,
          statusUpdatedAt: new Date(),
        }),
      ),
    });

    return manager.save(order);
  }

  private async resolveDashboardArtists(
    user: User,
  ): Promise<DashboardArtist[]> {
    if (user.role === UserRole.SUPER_ADMIN) {
      const artists = await this.artistsService.findAllForAdmin();
      return artists
        .filter(
          (artist) =>
            artist.status === ArtistStatus.APPROVED ||
            artist.status === ArtistStatus.SUSPENDED,
        )
        .map((artist) => ({
          id: artist.id,
          displayName: artist.displayName,
        }));
    }

    const artist = await this.artistsService.findApprovedByUserId(user.id);
    if (!artist) {
      throw new ForbiddenException('Approved artist profile required');
    }

    return [{ id: artist.id, displayName: artist.displayName }];
  }

  private selectDashboardArtist(
    user: User,
    artists: DashboardArtist[],
    artistId?: number,
  ): DashboardArtist | null {
    if (user.role !== UserRole.SUPER_ADMIN) {
      return artists[0] ?? null;
    }
    if (!artistId) {
      return null;
    }
    const selected = artists.find((artist) => artist.id === artistId);
    if (!selected) {
      throw new BadRequestException('Artist not found');
    }
    return selected;
  }

  private packRanges(slices: SalesSlice[]): Record<DashboardRangeId, SalesSlice> {
    return {
      previousMonth: slices[0],
      currentMonth: slices[1],
      last3: slices[2],
      lastYear: slices[3],
    };
  }

  private async loadArtistRangeSets(
    artists: DashboardArtist[],
    ranges: Array<{
      keys: string[];
      window: SalesWindow;
      bucket: 'day' | 'month';
    }>,
  ): Promise<ArtistSalesRanges[]> {
    const artistIds = artists.map((artist) => artist.id);
    const grouped = await Promise.all(
      ranges.map((range) =>
        this.loadSalesSlicesByArtist(
          artistIds,
          range.keys,
          range.window,
          range.bucket,
        ),
      ),
    );

    return artists.map((artist) => ({
      artistId: artist.id,
      displayName: artist.displayName,
      ranges: this.packRanges(
        grouped.map(
          (slices, index) =>
            slices.get(artist.id) ?? this.emptySalesSlice(ranges[index].keys),
        ),
      ),
    }));
  }

  private emptySalesSlice(keys: string[]): SalesSlice {
    return {
      mugsSold: 0,
      totalValueRon: 0,
      customersCount: 0,
      points: fillSalesPoints(keys, []),
      recentOrders: [],
    };
  }

  private async loadSalesSlice(
    artistIds: number[],
    keys: string[],
    window: SalesWindow,
    bucket: 'day' | 'month',
  ): Promise<SalesSlice> {
    const [pointRows, totalRows, recentOrders] = await Promise.all([
      this.loadSalesBuckets(artistIds, window, bucket, false),
      this.loadSalesBuckets(artistIds, window, null, false),
      this.loadRecentOrders(artistIds, window, false),
    ]);
    const total = parseSalesBucket(totalRows[0] ?? {});
    return {
      mugsSold: Math.round(total.mugsSold),
      totalValueRon: roundMoney(total.totalValueRon),
      customersCount: Math.round(total.customersCount),
      points: fillSalesPoints(keys, pointRows.map(parseSalesBucket)),
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        publicOrderNumber: order.publicOrderNumber,
        createdAt: order.createdAt,
        customerName: order.customerName,
        mugsSold: order.mugsSold,
        totalRon: order.totalRon,
        statuses: order.statuses,
      })),
    };
  }

  private async loadSalesSlicesByArtist(
    artistIds: number[],
    keys: string[],
    window: SalesWindow,
    bucket: 'day' | 'month',
  ): Promise<Map<number, SalesSlice>> {
    const [pointRows, totalRows, recentOrders] = await Promise.all([
      this.loadSalesBuckets(artistIds, window, bucket, true),
      this.loadSalesBuckets(artistIds, window, null, true),
      this.loadRecentOrders(artistIds, window, true),
    ]);
    const pointsByArtist = new Map<number, ReturnType<typeof parseSalesBucket>[]>();
    for (const row of pointRows) {
      const artistId = this.readArtistId(row);
      const current = pointsByArtist.get(artistId) ?? [];
      current.push(parseSalesBucket(row));
      pointsByArtist.set(artistId, current);
    }
    const totalsByArtist = new Map(
      totalRows.map((row) => [this.readArtistId(row), parseSalesBucket(row)]),
    );
    const ordersByArtist = new Map<
      number,
      Array<DashboardRecentOrder & { artistId: number }>
    >();
    for (const order of recentOrders) {
      const current = ordersByArtist.get(order.artistId) ?? [];
      if (current.length < 6) {
        current.push(order);
      }
      ordersByArtist.set(order.artistId, current);
    }

    return new Map(
      artistIds.map((artistId) => {
        const total = totalsByArtist.get(artistId);
        return [
          artistId,
          {
            mugsSold: Math.round(total?.mugsSold ?? 0),
            totalValueRon: roundMoney(total?.totalValueRon ?? 0),
            customersCount: Math.round(total?.customersCount ?? 0),
            points: fillSalesPoints(keys, pointsByArtist.get(artistId) ?? []),
            recentOrders: (ordersByArtist.get(artistId) ?? []).map((order) => ({
              id: order.id,
              publicOrderNumber: order.publicOrderNumber,
              createdAt: order.createdAt,
              customerName: order.customerName,
              mugsSold: order.mugsSold,
              totalRon: order.totalRon,
              statuses: order.statuses,
            })),
          },
        ];
      }),
    );
  }

  private readArtistId(row: Record<string, unknown>): number {
    const value = row.artistId ?? row.artistid;
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private applySalesRange(
    query: ReturnType<Repository<OrderItem>['createQueryBuilder']>,
    artistIds: number[],
    window: SalesWindow,
  ) {
    const countedPayments = [
      OrderPaymentStatus.PAID,
      OrderPaymentStatus.AWAITING_CASH,
    ];
    query
      .where('item.artistId IN (:...artistIds)', { artistIds })
      .andWhere('item.status != :cancelled', {
        cancelled: OrderItemStatus.CANCELLED,
      })
      .andWhere('ord.paymentStatus IN (:...countedPayments)', {
        countedPayments,
      });

    if (window.kind === 'month') {
      query.andWhere(
        `to_char(ord."createdAt" AT TIME ZONE 'Europe/Bucharest', 'YYYY-MM') = :month`,
        { month: window.month },
      );
      return;
    }

    const monthsBack = window.count - 1;
    query.andWhere(
      `ord."createdAt" >= (date_trunc('month', (now() AT TIME ZONE 'Europe/Bucharest')) - interval '${monthsBack} months') AT TIME ZONE 'Europe/Bucharest'`,
    );
  }

  private loadSalesBuckets(
    artistIds: number[],
    window: SalesWindow,
    bucket: 'day' | 'month' | null,
    groupByArtist: boolean,
  ): Promise<Record<string, unknown>[]> {
    const query = this.orderItemsRepository
      .createQueryBuilder('item')
      .innerJoin('item.order', 'ord')
      .select('COALESCE(SUM(item.quantity), 0)', 'mugsSold')
      .addSelect('COALESCE(SUM(item."lineTotalRon"), 0)', 'totalValueRon')
      .addSelect(
        'COUNT(DISTINCT LOWER(ord."customerEmail"))',
        'customersCount',
      );
    this.applySalesRange(query, artistIds, window);

    if (groupByArtist) {
      query.addSelect('item.artistId', 'artistId').addGroupBy('item.artistId');
    }
    if (bucket) {
      const bucketExpression =
        bucket === 'day'
          ? `to_char(date_trunc('day', ord."createdAt" AT TIME ZONE 'Europe/Bucharest'), 'YYYY-MM-DD')`
          : `to_char(date_trunc('month', ord."createdAt" AT TIME ZONE 'Europe/Bucharest'), 'YYYY-MM')`;
      query.addSelect(bucketExpression, 'bucket').addGroupBy(bucketExpression);
    }

    return query.getRawMany<Record<string, unknown>>();
  }

  private async loadRecentOrders(
    artistIds: number[],
    window: SalesWindow,
    perArtist: boolean,
  ): Promise<Array<DashboardRecentOrder & { artistId: number }>> {
    const query = this.orderItemsRepository
      .createQueryBuilder('item')
      .innerJoin('item.order', 'ord')
      .select('ord.id', 'id')
      .addSelect('ord.publicOrderNumber', 'publicOrderNumber')
      .addSelect('ord.createdAt', 'createdAt')
      .addSelect('ord.customerFirstName', 'customerFirstName')
      .addSelect('ord.customerLastName', 'customerLastName')
      .addSelect('COALESCE(SUM(item.quantity), 0)', 'mugsSold')
      .addSelect('COALESCE(SUM(item."lineTotalRon"), 0)', 'totalRon')
      .addSelect(`string_agg(DISTINCT item.status::text, ',')`, 'statuses')
      .groupBy('ord.id')
      .addGroupBy('ord.publicOrderNumber')
      .addGroupBy('ord.createdAt')
      .addGroupBy('ord.customerFirstName')
      .addGroupBy('ord.customerLastName')
      .orderBy('ord.createdAt', 'DESC')
      .limit(perArtist ? 200 : 6);
    if (perArtist) {
      query.addSelect('item.artistId', 'artistId').addGroupBy('item.artistId');
    }
    this.applySalesRange(query, artistIds, window);

    const rows = await query.getRawMany<Record<string, unknown>>();
    return rows.map((row) => ({
      id: Number(row.id ?? 0),
      publicOrderNumber: String(row.publicOrderNumber ?? ''),
      createdAt: this.asIsoTimestamp(row.createdAt),
      customerName: `${String(row.customerFirstName ?? '')} ${String(
        row.customerLastName ?? '',
      )}`.trim(),
      mugsSold: Math.round(Number(row.mugsSold ?? 0)),
      totalRon: roundMoney(Number(row.totalRon ?? 0)),
      statuses: String(row.statuses ?? '')
        .split(',')
        .map((status) => status.trim())
        .filter((status) => status.length > 0),
      artistId: perArtist ? this.readArtistId(row) : 0,
    }));
  }

  private asIsoTimestamp(value: unknown): string {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'string' && value) {
      return new Date(value).toISOString();
    }
    return '';
  }
}
