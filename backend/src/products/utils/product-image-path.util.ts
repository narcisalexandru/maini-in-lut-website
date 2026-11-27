import { BadRequestException } from '@nestjs/common';

const SAFE_PRODUCT_IMAGE =
  /^\/(?:uploads\/products\/[0-9a-f-]{36}\.webp|images\/[a-zA-Z0-9._/-]+)$/;

export function isSafeProductImagePath(value: string): boolean {
  return (
    SAFE_PRODUCT_IMAGE.test(value) &&
    !value.includes('..') &&
    !value.includes('\\') &&
    !value.includes('?') &&
    !value.includes('#')
  );
}

export function sanitizeProductImages(images: string[]): string[] {
  return images.map((image) => {
    const value = image.trim();
    if (!isSafeProductImagePath(value)) {
      throw new BadRequestException('Invalid product image path');
    }
    return value;
  });
}
