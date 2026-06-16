import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  private readonly RAPID_MODIFICATION_LIMIT = 10;
  private readonly COOLDOWN_TIME = 120; // 2 minutes in seconds
  private readonly TIME_WINDOW = 300; // 5 minutes in seconds
  private readonly SECONDARY_ADDRESSES_LIMIT = 3;

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  async createWithTransaction(createUserDto: CreateUserDto): Promise<User> {
    const queryRunner =
      this.usersRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = this.usersRepository.create(createUserDto);
      await queryRunner.manager.save(user);
      await queryRunner.commitTransaction();
      return user;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  findOne(id: number): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email });
  }

  findOneByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ phone });
  }

  findByVerificationToken(token: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email_verification_token: token });
  }

  async update(id: number, updateData: Partial<User>): Promise<User> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    await this.usersRepository.update(id, updateData);
    return this.findOne(id) as Promise<User>;
  }

  async updateAddress(
    id: number,
    updateData: Partial<User>,
  ): Promise<{ success: boolean; message?: string }> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check if user is in cooldown
    if (user.address_modification_cooldown) {
      const now = new Date();
      const diffInSeconds = Math.floor(
        (now.getTime() - user.address_modification_cooldown.getTime()) / 1000,
      );

      if (diffInSeconds < this.COOLDOWN_TIME) {
        throw new BadRequestException({
          success: false,
          message: `Please wait ${
            this.COOLDOWN_TIME - diffInSeconds
          } seconds before modifying your address again`,
        });
      } else {
        // Reset cooldown if it has expired
        user.address_modification_cooldown = null;
        user.address_modification_history = [];
      }
    }

    // Initialize history if it doesn't exist
    if (!user.address_modification_history) {
      user.address_modification_history = [];
    }

    // Add current modification to history
    user.address_modification_history.push({
      timestamp: new Date().toISOString(), // Store as ISO string
    });

    // Check for rapid modifications
    const now = new Date();
    const recentModifications = user.address_modification_history.filter(
      (mod) =>
        Math.floor(
          (now.getTime() - new Date(mod.timestamp).getTime()) / 1000,
        ) <= this.TIME_WINDOW,
    );

    if (recentModifications.length >= this.RAPID_MODIFICATION_LIMIT) {
      // Set cooldown
      user.address_modification_cooldown = new Date();
      await this.usersRepository.save(user);

      throw new BadRequestException({
        success: false,
        message: `You have modified your address too frequently. Please wait ${this.COOLDOWN_TIME} seconds before trying again.`,
      });
    }

    // Update address fields
    const updateFields = {
      county: updateData.county,
      city: updateData.city,
      street: updateData.street,
      postal_code: updateData.postal_code,
      address_modification_history: user.address_modification_history,
    };

    await this.usersRepository.update(id, updateFields);
    return { success: true };
  }

  async updatePhone(
    id: number,
    phone: string,
  ): Promise<{ success: boolean; message?: string }> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check if phone number is already in use by another user
    if (phone) {
      const existingUser = await this.findOneByPhone(phone);
      if (existingUser && existingUser.id !== id) {
        throw new BadRequestException({
          success: false,
          message: 'Phone number is already in use by another user',
        });
      }
    }

    // Validate phone number format
    if (phone && !/^[0-9]{10}$/.test(phone)) {
      throw new BadRequestException({
        success: false,
        message: 'Phone number must be exactly 10 digits',
      });
    }

    await this.usersRepository.update(id, { phone });
    return { success: true };
  }

  async getCheckoutAddresses(id: number): Promise<{
    primaryAddress: {
      county: string;
      city: string;
      street: string;
      postal_code: string;
    } | null;
    secondaryAddresses: {
      label?: string;
      county: string;
      city: string;
      street: string;
      postal_code: string;
    }[];
    phone: string | null;
  }> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    const hasPrimary =
      !!user.county && !!user.city && !!user.street && !!user.postal_code;
    return {
      primaryAddress: hasPrimary
        ? {
            county: user.county,
            city: user.city,
            street: user.street,
            postal_code: user.postal_code,
          }
        : null,
      secondaryAddresses: Array.isArray(user.secondary_addresses)
        ? user.secondary_addresses
        : [],
      phone: user.phone || null,
    };
  }

  async addSecondaryAddress(
    id: number,
    address: {
      label?: string;
      county: string;
      city: string;
      street: string;
      postal_code: string;
    },
  ): Promise<{ success: boolean; secondaryAddresses: User['secondary_addresses'] }> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    if (!address.county || !address.city || !address.street || !address.postal_code) {
      throw new BadRequestException('All address fields are required');
    }
    const current = Array.isArray(user.secondary_addresses)
      ? [...user.secondary_addresses]
      : [];
    if (current.length >= this.SECONDARY_ADDRESSES_LIMIT) {
      throw new BadRequestException(
        `You can save up to ${this.SECONDARY_ADDRESSES_LIMIT} secondary addresses.`,
      );
    }
    current.push({
      label: address.label?.trim() || 'Acasa',
      county: address.county.trim(),
      city: address.city.trim(),
      street: address.street.trim(),
      postal_code: address.postal_code.trim(),
    });
    await this.usersRepository.update(id, { secondary_addresses: current });
    return { success: true, secondaryAddresses: current };
  }

  async updateSecondaryAddress(
    id: number,
    index: number,
    address: {
      label?: string;
      county: string;
      city: string;
      street: string;
      postal_code: string;
    },
  ): Promise<{ success: boolean; secondaryAddresses: User['secondary_addresses'] }> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    const current = Array.isArray(user.secondary_addresses)
      ? [...user.secondary_addresses]
      : [];
    if (index < 0 || index >= current.length) {
      throw new BadRequestException('Secondary address index is invalid');
    }
    if (!address.county || !address.city || !address.street || !address.postal_code) {
      throw new BadRequestException('All address fields are required');
    }
    current[index] = {
      label: address.label?.trim() || current[index].label || `Adresa ${index + 1}`,
      county: address.county.trim(),
      city: address.city.trim(),
      street: address.street.trim(),
      postal_code: address.postal_code.trim(),
    };
    await this.usersRepository.update(id, { secondary_addresses: current });
    return { success: true, secondaryAddresses: current };
  }

  async deleteSecondaryAddress(
    id: number,
    index: number,
  ): Promise<{ success: boolean; secondaryAddresses: User['secondary_addresses'] }> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    const current = Array.isArray(user.secondary_addresses)
      ? [...user.secondary_addresses]
      : [];
    if (index < 0 || index >= current.length) {
      throw new BadRequestException('Secondary address index is invalid');
    }

    const hasPrimaryAddress =
      !!user.county && !!user.city && !!user.street && !!user.postal_code;
    if (!hasPrimaryAddress && current.length <= 1) {
      throw new BadRequestException(
        'At least one address must remain associated with your account.',
      );
    }

    current.splice(index, 1);
    await this.usersRepository.update(id, { secondary_addresses: current });
    return { success: true, secondaryAddresses: current };
  }

  async getAddressModificationStatus(id: number): Promise<{
    inCooldown: boolean;
    cooldownRemaining?: number;
    recentModifications: number;
  }> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const now = new Date();
    let cooldownRemaining: number | undefined;

    if (user.address_modification_cooldown) {
      const diffInSeconds = Math.floor(
        (now.getTime() - user.address_modification_cooldown.getTime()) / 1000,
      );
      if (diffInSeconds < this.COOLDOWN_TIME) {
        cooldownRemaining = this.COOLDOWN_TIME - diffInSeconds;
      }
    }

    const recentModifications =
      user.address_modification_history?.filter(
        (mod) =>
          Math.floor(
            (now.getTime() - new Date(mod.timestamp).getTime()) / 1000,
          ) <= this.TIME_WINDOW,
      ).length || 0;

    return {
      inCooldown: !!cooldownRemaining,
      cooldownRemaining,
      recentModifications,
    };
  }

  async deleteAccount(
    id: number,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    try {
      await this.usersRepository.remove(user);
      return {
        success: true,
        message: 'Account deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException({
        success: false,
        message: 'Failed to delete account',
      });
    }
  }
}
