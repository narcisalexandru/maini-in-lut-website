import { BadRequestException } from '@nestjs/common';
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

  it('blocks item updates before payment is confirmed', async () => {
    const orderItemsRepository = service['orderItemsRepository'] as jest.Mocked<
      Repository<OrderItem>
    >;
    orderItemsRepository.findOne.mockResolvedValue({
      id: 5,
      artistId: 2,
      order: { paymentStatus: OrderPaymentStatus.PENDING },
    } as OrderItem);

    await expect(
      service.updateItemStatus(
        { id: 1, role: UserRole.SUPER_ADMIN } as never,
        5,
        'PROCESSING' as never,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
