import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArtistsService } from './artists.service';
import { Artist } from './entities/artist.entity';
import { UsersService } from '../users/users.service';
import { ArtistStatus } from '../common/enums/artist-status.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';

describe('ArtistsService', () => {
  let service: ArtistsService;
  let artistsRepository: jest.Mocked<Repository<Artist>>;

  const usersService = {
    findOne: jest.fn(),
    findSuperAdminEmails: jest.fn().mockResolvedValue([]),
  };

  const emailService = {
    sendArtistApplicationNotification: jest.fn(),
    sendArtistApplicationReceived: jest.fn(),
    sendArtistApplicationApproved: jest.fn(),
    sendArtistApplicationRejected: jest.fn(),
  };

  const configService = {
    get: jest.fn().mockReturnValue('http://localhost:3000'),
  };

  beforeEach(async () => {
    artistsRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      manager: {
        connection: {
          createQueryRunner: jest.fn(),
        },
      },
    } as unknown as jest.Mocked<Repository<Artist>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArtistsService,
        {
          provide: getRepositoryToken(Artist),
          useValue: artistsRepository,
        },
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: EmailService,
          useValue: emailService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get(ArtistsService);
    jest.clearAllMocks();
  });

  it('creates a new pending application for a client', async () => {
    usersService.findOne.mockResolvedValue({
      id: 1,
      role: UserRole.CLIENT,
    });
    artistsRepository.findOne.mockResolvedValue(null);
    artistsRepository.create.mockImplementation((data) => data as Artist);
    artistsRepository.save.mockImplementation(async (artist) =>
      Object.assign({ id: 10 }, artist) as Artist,
    );
    artistsRepository.findOne.mockImplementation(async (options) => {
      const where = options?.where as { id?: number } | undefined;
      if (where?.id === 10) {
        return {
          id: 10,
          displayName: 'Narcis Ceramics',
          status: ArtistStatus.PENDING,
          user: {
            id: 1,
            first_name: 'Narcis',
            last_name: 'Cazacu',
            email: 'test@example.com',
          },
        } as Artist;
      }
      return null;
    });

    const result = await service.apply(1, {
      artistFirstName: 'Narcis',
      artistLastName: 'Cazacu',
      companyCui: '54003138',
      companyLegalName: 'MAINI IN LUT SRL',
      displayName: 'Narcis Ceramics',
      contactEmail: 'test@example.com',
      contactPhone: '0700000000',
    });

    expect(result.displayName).toBe('Narcis Ceramics');
    expect(result.status).toBe(ArtistStatus.PENDING);
    expect(artistsRepository.save).toHaveBeenCalled();
  });

  it('rejects duplicate pending applications', async () => {
    usersService.findOne.mockResolvedValue({
      id: 1,
      role: UserRole.CLIENT,
    });
    artistsRepository.findOne.mockResolvedValue({
      id: 5,
      userId: 1,
      status: ArtistStatus.PENDING,
    } as Artist);

    await expect(
      service.apply(1, {
        artistFirstName: 'Narcis',
        artistLastName: 'Cazacu',
        companyCui: '54003138',
        companyLegalName: 'MAINI IN LUT SRL',
        displayName: 'Narcis Ceramics',
        contactEmail: 'test@example.com',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
