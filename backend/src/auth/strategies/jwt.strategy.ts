import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UsersService } from '../../users/users.service';
import { User } from '../../users/entities/user.entity';
import { JwtPayload } from '../../common/types/jwt-payload.interface';
import { ACCESS_TOKEN_COOKIE } from '../auth-cookie.util';

function accessTokenFromCookie(req: Request): string | null {
  const token = req?.cookies?.[ACCESS_TOKEN_COOKIE];
  return typeof token === 'string' && token ? token : null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private usersService: UsersService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        accessTokenFromCookie,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.usersService.findOne(payload.sub);
    if (!user || !user.is_email_verified) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
