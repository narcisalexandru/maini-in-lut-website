import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import { Request, Response } from 'express';
import {
  OAUTH_STATE_COOKIE,
  oauthStateCookieOptions,
} from '../auth-cookie.util';

@Injectable()
export class GoogleStateGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const expected = req.cookies?.[OAUTH_STATE_COOKIE];
    const actual = typeof req.query.state === 'string' ? req.query.state : '';
    res.clearCookie(
      OAUTH_STATE_COOKIE,
      oauthStateCookieOptions(this.configService, req),
    );
    if (!this.matches(expected, actual)) {
      const frontend = (
        this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'
      ).replace(/\/$/, '');
      res.redirect(`${frontend}/login?error=oauth`);
      return false;
    }
    return true;
  }

  private matches(expected: unknown, actual: string): boolean {
    if (typeof expected !== 'string' || !expected || !actual) {
      return false;
    }
    const expectedBuffer = Buffer.from(expected);
    const actualBuffer = Buffer.from(actual);
    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }
    return timingSafeEqual(expectedBuffer, actualBuffer);
  }
}
