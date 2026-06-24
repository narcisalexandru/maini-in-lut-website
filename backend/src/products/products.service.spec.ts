import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { ProductChangeProposal } from './entities/product-change-proposal.entity';
import { ArtistsService } from '../artists/artists.service';
import { ProductStatus } from '../common/enums/product-status.enum';

describe('ProductsService', () => {
  let service: ProductsService;
  let productsRepository: jest.Mocked<Repository<Product>>;

  const artistsService = {
    findApprovedByUserId: jest.fn(),
  };

  beforeEach(async () => {
    productsRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
      find: jest.fn(),
    } as unknown as jest.Mocked<Repository<Product>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: productsRepository,
        },
        {
          provide: getRepositoryToken(ProductChangeProposal),
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

    service = module.get(ProductsService);
    jest.clearAllMocks();
  });

  it('rejects approval when product is not pending review', async () => {
    productsRepository.findOne.mockResolvedValue({
      id: 1,
      status: ProductStatus.DRAFT,
    } as Product);

    await expect(service.approve(1, 99)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
