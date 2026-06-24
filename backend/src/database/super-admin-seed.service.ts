import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../users/entities/user.entity';
import { SUPER_ADMIN_EMAILS } from './seeds/super-admins.seed';

@Injectable()
export class SuperAdminSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SuperAdminSeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedSuperAdmins();
  }

  async seedSuperAdmins(): Promise<void> {
    if (!SUPER_ADMIN_EMAILS.length) {
      return;
    }

    for (const email of SUPER_ADMIN_EMAILS) {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail) {
        continue;
      }

      const user = await this.usersRepository
        .createQueryBuilder('user')
        .where('LOWER(user.email) = :email', { email: normalizedEmail })
        .getOne();

      if (!user) {
        this.logger.warn(
          `Super-admin seed skipped: no user found for ${normalizedEmail}`,
        );
        continue;
      }

      if (user.role === UserRole.SUPER_ADMIN) {
        continue;
      }

      user.role = UserRole.SUPER_ADMIN;
      await this.usersRepository.save(user);
      this.logger.log(`Promoted ${user.email} to SUPER_ADMIN`);
    }
  }
}
