import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { GuestHolderService } from './guest-holder.service';

describe('GuestHolderService', () => {
  const service = new GuestHolderService({
    get: (key: string) => (key === 'JWT_SECRET' ? 'test-secret' : undefined),
  } as ConfigService);

  it('ignores a client-supplied reservation id', () => {
    const request = {
      cookies: { guest_cart: '11111111-1111-4111-8111-111111111111' },
      ip: '127.0.0.1',
    } as unknown as Request;

    expect(service.readIfPresent(request)).toBeNull();
  });
});
