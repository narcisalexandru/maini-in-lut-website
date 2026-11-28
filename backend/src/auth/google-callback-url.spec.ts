import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { googleCallbackUrl } from './google-callback-url';

function config(values: Record<string, string>): ConfigService {
  return {
    get: (key: string) => values[key],
  } as ConfigService;
}

describe('google callback url', () => {
  const values = {
    FRONTEND_URL: 'https://shop.example.com',
  };

  it('uses the public site when the request comes from that site', () => {
    const req = {
      get: (name: string) =>
        name === 'x-maini-public-origin' ? 'https://shop.example.com' : undefined,
    } as Request;

    expect(googleCallbackUrl(config(values), req)).toBe(
      'https://shop.example.com/api/auth/google/callback',
    );
  });

  it('keeps local sign-in on localhost', () => {
    const req = {
      get: (name: string) =>
        name === 'x-maini-public-origin' ? 'http://localhost:3000' : undefined,
    } as Request;

    expect(googleCallbackUrl(config(values), req)).toBe(
      'http://localhost:3000/api/auth/google/callback',
    );
  });

  it('ignores an origin that is not the configured site', () => {
    const req = {
      get: (name: string) =>
        name === 'x-maini-public-origin' ? 'https://evil.example' : undefined,
    } as Request;

    expect(googleCallbackUrl(config(values), req)).toBe(
      'https://shop.example.com/api/auth/google/callback',
    );
  });
});
