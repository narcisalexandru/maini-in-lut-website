import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

const LOCAL_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000'];

export function browserOrigin(config: ConfigService, req?: Request): string {
  const allowed = new Set(LOCAL_ORIGINS);
  const frontend = config.get<string>('FRONTEND_URL')?.trim();
  if (frontend) {
    try {
      allowed.add(new URL(frontend).origin);
    } catch {
      // FRONTEND_URL is validated at startup. Ignore a value that is not a URL.
    }
  }

  const header = req?.get('x-maini-public-origin')?.trim();
  if (header && allowed.has(header)) {
    return header;
  }
  if (frontend) {
    try {
      return new URL(frontend).origin;
    } catch {
      return 'http://localhost:3000';
    }
  }
  return 'http://localhost:3000';
}

export function googleCallbackUrl(config: ConfigService, req?: Request): string {
  return `${browserOrigin(config, req)}/api/auth/google/callback`;
}
