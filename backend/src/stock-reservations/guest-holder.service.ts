import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { Request, Response } from 'express';
import { accessTokenCookieOptions } from '../auth/auth-cookie.util';

export const GUEST_CART_COOKIE = 'guest_cart';
const IP_BINDING_MS = 30 * 60 * 1000;
const GUEST_COOKIE_MS = 30 * 24 * 60 * 60 * 1000;

type IpBinding = { id: string; expiresAt: number };

@Injectable()
export class GuestHolderService {
  private readonly holdersByIp = new Map<string, IpBinding>();

  constructor(private readonly configService: ConfigService) {}

  resolve(req: Request, res: Response): string {
    const ip = this.clientIp(req);
    const fromCookie = this.readValidId(req);
    if (fromCookie) {
      this.remember(ip, fromCookie);
      this.writeCookie(req, res, fromCookie);
      return fromCookie;
    }

    const existing = this.holdersByIp.get(ip);
    if (existing && existing.expiresAt > Date.now()) {
      existing.expiresAt = Date.now() + IP_BINDING_MS;
      this.writeCookie(req, res, existing.id);
      return existing.id;
    }

    const id = randomUUID();
    this.remember(ip, id);
    this.writeCookie(req, res, id);
    return id;
  }

  readIfPresent(req: Request): string | null {
    return this.readValidId(req);
  }

  private remember(ip: string, id: string): void {
    this.holdersByIp.set(ip, { id, expiresAt: Date.now() + IP_BINDING_MS });
    if (this.holdersByIp.size > 5000) {
      const now = Date.now();
      for (const [key, value] of this.holdersByIp) {
        if (value.expiresAt <= now) {
          this.holdersByIp.delete(key);
        }
      }
    }
  }

  private readValidId(req: Request): string | null {
    const raw = req.cookies?.[GUEST_CART_COOKIE];
    if (typeof raw !== 'string' || !raw) {
      return null;
    }
    return this.verify(raw);
  }

  private writeCookie(req: Request, res: Response, id: string): void {
    const base = accessTokenCookieOptions(this.configService, req);
    res.cookie(GUEST_CART_COOKIE, this.sign(id), {
      ...base,
      maxAge: GUEST_COOKIE_MS,
    });
  }

  private sign(id: string): string {
    const mac = createHmac('sha256', this.secret()).update(id).digest('base64url');
    return `${id}.${mac}`;
  }

  private verify(value: string): string | null {
    const dot = value.lastIndexOf('.');
    if (dot <= 0) {
      return null;
    }
    const id = value.slice(0, dot);
    const mac = value.slice(dot + 1);
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      return null;
    }
    const expected = createHmac('sha256', this.secret()).update(id).digest('base64url');
    const actualBuffer = Buffer.from(mac);
    const expectedBuffer = Buffer.from(expected);
    if (
      actualBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(actualBuffer, expectedBuffer)
    ) {
      return null;
    }
    return id;
  }

  private secret(): string {
    const secret = this.configService.get<string>('JWT_SECRET')?.trim();
    if (!secret) {
      throw new Error('JWT_SECRET lipseste din backend/.env');
    }
    return secret;
  }

  private clientIp(req: Request): string {
    return req.ip || req.socket.remoteAddress || 'unknown';
  }
}
