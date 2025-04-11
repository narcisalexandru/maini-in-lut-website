import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User, UserWithoutPassword } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserWithoutPassword | null> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      if (!user.is_email_verified) {
        throw new UnauthorizedException('Please verify your email first');
      }
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: User | UserWithoutPassword) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        county: user.county,
        city: user.city,
        street: user.street,
        postal_code: user.postal_code,
        picture: user.picture,
      },
    };
  }

  async register(createUserDto: CreateUserDto) {
    try {
      const existingUser = await this.usersService.findOneByEmail(
        createUserDto.email,
      );
      if (existingUser) {
        throw new ConflictException({
          message: 'Email already exists',
          statusCode: 409,
        });
      }

      if (createUserDto.phone) {
        const existingPhone = await this.usersService.findOneByPhone(
          createUserDto.phone,
        );
        if (existingPhone) {
          throw new ConflictException({
            message: 'Phone number already exists',
            statusCode: 409,
          });
        }
      }

      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenExpires = new Date();
      verificationTokenExpires.setHours(
        verificationTokenExpires.getHours() + 24,
      );

      const userData = {
        ...createUserDto,
        password: hashedPassword,
        email_verification_token: verificationToken,
        email_verification_token_expires: verificationTokenExpires,
        is_email_verified: false,
      };

      const user = await this.usersService.createWithTransaction(userData);

      const verificationLink = `${this.configService.get(
        'FRONTEND_URL',
      )}/auth/verify-email?token=${verificationToken}`;

      await this.emailService.sendVerificationEmail(
        user.email,
        user.first_name,
        user.last_name,
        verificationLink,
      );

      return {
        message:
          'Registration successful. Please check your email to verify your account.',
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
        },
      };
    } catch (error) {
      this.logger.error('Registration failed', error);
      throw error;
    }
  }

  async verifyEmail(token: string) {
    const user = await this.usersService.findByVerificationToken(token);
    if (!user) {
      throw new UnauthorizedException('Invalid verification token');
    }

    if (
      !user.email_verification_token_expires ||
      user.email_verification_token_expires < new Date()
    ) {
      throw new UnauthorizedException('Verification token has expired');
    }

    await this.usersService.update(user.id, {
      is_email_verified: true,
      email_verification_token: null,
      email_verification_token_expires: null,
    });

    return { message: 'Email verified successfully' };
  }

  async googleLogin(req) {
    if (!req.user) {
      return 'No user from google';
    }

    let user = await this.usersService.findOneByEmail(req.user.email);

    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await this.usersService.create({
        email: req.user.email,
        first_name: req.user.name.split(' ')[0],
        last_name: req.user.name.split(' ')[1] || '',
        picture: req.user.picture,
        password: hashedPassword,
        is_email_verified: true,
      });
    }

    return this.login(user);
  }
}
