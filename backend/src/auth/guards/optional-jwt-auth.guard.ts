import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { ACCESS_TOKEN_COOKIE } from '../auth-cookie.util';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.headers.authorization;
    const hasBearer =
      typeof authorization === 'string' &&
      authorization.startsWith('Bearer ') &&
      Boolean(authorization.slice(7).trim());
    const cookie = request.cookies?.[ACCESS_TOKEN_COOKIE];
    const hasCookie = typeof cookie === 'string' && Boolean(cookie);
    if (!hasBearer && !hasCookie) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest<TUser>(err: Error | null, user: TUser): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('Token invalid');
    }
    return user;
  }
}
