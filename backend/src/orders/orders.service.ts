import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
import {
  applyActiveOrdersFilter,
  applyArchivedOrdersFilter,
  TERMINAL_ORDER_ITEM_STATUSES,
} from '../common/utils/order-archive.util';

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
  ) {}

  generatePublicOrderNumber(prefix: 'MIL' | 'COD'): string {
    return `${prefix}-${Date.now()}`;
  }

  async createCardOrder(input: CreateOrderInput): Promise<Order> {
    return this.persistOrder({
      ...input,
      paymentMethod: PaymentMethod.CARD,
      paymentStatus: OrderPaymentStatus.PENDING,
      publicOrderNumber: this.generatePublicOrderNumber('MIL'),
    });
  }

  async createCashOrder(input: CreateOrderInput): Promise<Order> {
    return this.persistOrder({
      ...input,
      paymentMethod: PaymentMethod.CASH,
      paymentStatus: OrderPaymentStatus.PAID,
      publicOrderNumber: this.generatePublicOrderNumber('COD'),
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

  async findByPublicOrderNumber(
    publicOrderNumber: string,
  ): Promise<Order | null> {
    return this.ordersRepository.findOne({
      where: { publicOrderNumber },
      relations: ['items', 'items.artist'],
    });
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
      .innerJoinAndSelect(
        'order.items',
        'item',
        'item.artistId = :artistId',
        { artistId: artist.id },
      )
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
        throw new ForbiddenException('You can only update your own order items');
      }
    } else if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (item.order.paymentStatus !== OrderPaymentStatus.PAID) {
      throw new BadRequestException(
        'Order items can only be updated after payment is confirmed',
      );
    }

    const previousStatus = item.status;
    item.status = status;
    item.statusUpdatedAt = new Date();
    if (previousStatus !== status) {
      item.isUnarchived = false;
    }
    return this.orderItemsRepository.save(item);
  }

  async unarchiveOrder(user: User, orderId: number): Promise<Order> {
    const order = await this.findOneForAdmin(orderId);

    let itemsToUnarchive: OrderItem[];

    if (user.role === UserRole.ARTIST) {
      const artist = await this.artistsService.findApprovedByUserId(user.id);
      if (!artist) {
        throw new ForbiddenException('Approved artist profile required');
      }

      itemsToUnarchive = (order.items ?? []).filter(
        (item) => item.artistId === artist.id,
      );
      if (!itemsToUnarchive.length) {
        throw new ForbiddenException('You can only unarchive your own orders');
      }
    } else if (user.role === UserRole.SUPER_ADMIN) {
      itemsToUnarchive = order.items ?? [];
    } else {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (
      !this.areAllItemsTerminal(itemsToUnarchive) ||
      itemsToUnarchive.some((item) => item.isUnarchived)
    ) {
      throw new BadRequestException('Order is not archived');
    }

    for (const item of itemsToUnarchive) {
      item.isUnarchived = true;
    }
    await this.orderItemsRepository.save(itemsToUnarchive);

    return this.findOneForAdmin(orderId);
  }

  private areAllItemsTerminal(items: OrderItem[]): boolean {
    if (!items.length) {
      return false;
    }

    return items.every((item) =>
      (TERMINAL_ORDER_ITEM_STATUSES as readonly OrderItemStatus[]).includes(
        item.status,
      ),
    );
  }

  private async persistOrder(
    input: CreateOrderInput & {
      paymentMethod: PaymentMethod;
      paymentStatus: OrderPaymentStatus;
      publicOrderNumber: string;
    },
  ): Promise<Order> {
    if (!input.items.length) {
      throw new BadRequestException('Order must contain at least one item');
    }

    const order = this.ordersRepository.create({
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
      billingDetails: input.billingDetails ?? null,
      paymentMethod: input.paymentMethod,
      paymentStatus: input.paymentStatus,
      subtotalRon: input.subtotalRon,
      deliveryFeeRon: input.deliveryFeeRon,
      cashOperationalFeeRon: input.cashOperationalFeeRon,
      totalRon: input.totalRon,
      items: input.items.map((line) =>
        this.orderItemsRepository.create({
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

    return this.ordersRepository.save(order);
  }
}
