import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
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
}
