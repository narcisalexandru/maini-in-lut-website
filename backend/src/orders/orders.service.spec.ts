import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { ArtistsService } from '../artists/artists.service';
import { OrderPaymentStatus } from '../common/enums/order-status.enum';
import { UserRole } from '../common/enums/user-role.enum';

describe('OrdersService', () => {
  let service: OrdersService;
  let ordersRepository: jest.Mocked<Repository<Order>>;

  const artistsService = {
    findApprovedByUserId: jest.fn(),
  };

  beforeEach(async () => {
    ordersRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<Repository<Order>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(Order),
          useValue: ordersRepository,
        },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: ArtistsService,
          useValue: artistsService,
        },
      ],
    }).compile();

    service = module.get(OrdersService);
    jest.clearAllMocks();
  });

  it('skips duplicate card payment confirmation', async () => {
    ordersRepository.findOne.mockResolvedValue({
      id: 1,
      publicOrderNumber: 'MIL-123',
      paymentStatus: OrderPaymentStatus.PAID,
    } as Order);

    const result = await service.markCardOrderPaid('MIL-123');
    expect(result?.paymentStatus).toBe(OrderPaymentStatus.PAID);
    expect(ordersRepository.save).not.toHaveBeenCalled();
  });

  it('marks stock fulfillment only once', async () => {
    const order = {
      id: 1,
      publicOrderNumber: 'MIL-123',
      stockFulfilledAt: null,
    } as Order;
    ordersRepository.findOne.mockResolvedValue(order);
    ordersRepository.save.mockImplementation(async (value) => value as Order);

    const result = await service.markStockFulfilled('MIL-123');
    expect(result?.stockFulfilledAt).toBeInstanceOf(Date);
    expect(ordersRepository.save).toHaveBeenCalled();
  });

  it('skips stock fulfillment when already recorded', async () => {
    const fulfilledAt = new Date('2026-08-26T10:00:00.000Z');
    ordersRepository.findOne.mockResolvedValue({
      id: 1,
      publicOrderNumber: 'MIL-123',
      stockFulfilledAt: fulfilledAt,
    } as Order);

    const result = await service.markStockFulfilled('MIL-123');
    expect(result?.stockFulfilledAt).toBe(fulfilledAt);
    expect(ordersRepository.save).not.toHaveBeenCalled();
  });

  it('updates item status before payment is confirmed', async () => {
    const orderItemsRepository = service['orderItemsRepository'] as jest.Mocked<
      Repository<OrderItem>
    >;
    const item = {
      id: 5,
      artistId: 2,
      status: 'PENDING',
      order: { paymentStatus: OrderPaymentStatus.PENDING },
    } as OrderItem;
    orderItemsRepository.findOne.mockResolvedValue(item);
    orderItemsRepository.save.mockImplementation(async (value) => value as OrderItem);

    const result = await service.updateItemStatus(
      { id: 1, role: UserRole.SUPER_ADMIN } as never,
      5,
      'PROCESSING' as never,
    );

    expect(result.status).toBe('PROCESSING');
  });

  it('archives an artist order without deleting it', async () => {
    const item = {
      id: 5,
      artistId: 2,
      status: 'PENDING',
      isUnarchived: false,
      isManuallyArchived: false,
    };
    ordersRepository.findOne.mockResolvedValue({
      id: 9,
      items: [item],
    } as unknown as Order);
    artistsService.findApprovedByUserId.mockResolvedValue({ id: 2 });
    const orderItemsRepository = service['orderItemsRepository'] as jest.Mocked<
      Repository<OrderItem>
    >;
    orderItemsRepository.save.mockImplementation(async (value) => value as OrderItem);

    await service.archiveOrder({ id: 4, role: UserRole.ARTIST } as never, 9);

    expect(item.isManuallyArchived).toBe(true);
    expect(item.isUnarchived).toBe(false);
    expect(ordersRepository.delete).not.toHaveBeenCalled();
  });

  it('rejects order deletion for an artist', async () => {
    await expect(
      service.deleteOrder({ id: 4, role: UserRole.ARTIST } as never, 9),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(ordersRepository.delete).not.toHaveBeenCalled();
  });

  it('deletes an order for a super admin', async () => {
    ordersRepository.findOne.mockResolvedValue({ id: 9, items: [] } as unknown as Order);
    ordersRepository.delete.mockResolvedValue({ affected: 1, raw: [] });
    const orderItemsRepository = service['orderItemsRepository'] as jest.Mocked<
      Repository<OrderItem>
    >;
    orderItemsRepository.delete.mockResolvedValue({ affected: 0, raw: [] });

    await service.deleteOrder({ id: 1, role: UserRole.SUPER_ADMIN } as never, 9);

    expect(orderItemsRepository.delete).toHaveBeenCalledWith({ orderId: 9 });
    expect(ordersRepository.delete).toHaveBeenCalledWith(9);
  });
});
