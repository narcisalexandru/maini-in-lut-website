import { ConfigService } from '@nestjs/config';
import { CookieOptions, Request } from 'express';

export const ACCESS_TOKEN_COOKIE = 'access_token';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

type SameSiteOption = 'lax' | 'strict' | 'none';

function hostname(value?: string): string {
  if (!value) {
    return '';
  }
  try {
    return new URL(value).hostname;
  } catch {
    return '';
  }
}

export function accessTokenCookieOptions(
  config: ConfigService,
  req?: Request,
): CookieOptions {
  const configuredSite = config.get<string>('COOKIE_SAMESITE')?.trim().toLowerCase();
  const frontendHost = hostname(config.get<string>('FRONTEND_URL'));
  const requestHost = req?.hostname || '';
  const crossSite = Boolean(
    requestHost && frontendHost && requestHost !== frontendHost,
  );
  let sameSite: SameSiteOption =
    configuredSite === 'none' ||
    configuredSite === 'strict' ||
    configuredSite === 'lax'
      ? configuredSite
      : crossSite
        ? 'none'
        : 'lax';
  const secureFlag = config.get<string>('COOKIE_SECURE')?.trim().toLowerCase();
  let secure =
    sameSite === 'none' ||
    secureFlag === 'true' ||
    (secureFlag !== 'false' &&
      (req?.secure === true || config.get('NODE_ENV') === 'production'));
  if (sameSite === 'none' && req && !req.secure) {
    sameSite = 'lax';
    secure = false;
  }

  return {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
    maxAge: ONE_DAY_MS,
  };
}

export const OAUTH_STATE_COOKIE = 'oauth_state';
const TEN_MINUTES_MS = 10 * 60 * 1000;

export function oauthStateCookieOptions(
  config: ConfigService,
  req?: Request,
): CookieOptions {
  return {
    ...accessTokenCookieOptions(config, req),
    maxAge: TEN_MINUTES_MS,
  };
}
