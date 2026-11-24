import { BadRequestException } from '@nestjs/common';
import { sanitizeProductImages } from './product-image-path.util';

describe('product image paths', () => {
  it('rejects a localhost path that traverses directories', () => {
    expect(() =>
      sanitizeProductImages(['http://localhost/uploads/../etc/passwd']),
    ).toThrow(BadRequestException);
  });

  it('accepts a generated upload path', () => {
    const path = '/uploads/products/11111111-1111-4111-8111-111111111111.webp';
    expect(sanitizeProductImages([path])).toEqual([path]);
  });
});
