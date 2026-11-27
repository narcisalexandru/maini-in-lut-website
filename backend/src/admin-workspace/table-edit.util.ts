import { BadRequestException } from '@nestjs/common';
import { OrderItemStatus } from '../common/enums/order-status.enum';

export const MAX_TABLE_REVISIONS = 50;

export const ADMIN_TABLE_KEYS = [
  'admin-orders',
  'admin-customers',
  'admin-products',
] as const;

export type AdminTableKey = (typeof ADMIN_TABLE_KEYS)[number];

export type TableEditKind =
  | 'order-item-status'
  | 'order-delivery'
  | 'order-note'
  | 'product-fields'
  | 'customer-fields';

const KINDS_BY_TABLE: Record<AdminTableKey, readonly TableEditKind[]> = {
  'admin-orders': ['order-item-status', 'order-delivery', 'order-note'],
  'admin-customers': ['customer-fields'],
  'admin-products': ['product-fields'],
};

const ORDER_STATUSES = new Set<string>(Object.values(OrderItemStatus));

export function sequencesToDrop(
  sequences: number[],
  max = MAX_TABLE_REVISIONS,
): number[] {
  if (sequences.length <= max) {
    return [];
  }

  return [...sequences].sort((left, right) => left - right).slice(0, sequences.length - max);
}

export function assertTableKey(value: string): AdminTableKey {
  if ((ADMIN_TABLE_KEYS as readonly string[]).includes(value)) {
    return value as AdminTableKey;
  }
  throw new BadRequestException('Unknown admin table');
}

export function assertEditKind(tableKey: AdminTableKey, kind: string): TableEditKind {
  const allowed = KINDS_BY_TABLE[tableKey];
  if ((allowed as readonly string[]).includes(kind)) {
    return kind as TableEditKind;
  }
  throw new BadRequestException('This change is not allowed in this table');
}

export function composeDeliveryAddress(parts: {
  street?: string | null;
  city?: string | null;
  county?: string | null;
  postalCode?: string | null;
}): string {
  const street = parts.street?.trim() || '';
  const existing = new Set(
    street
      .split(',')
      .map((part) => part.trim().toLowerCase())
      .filter((part) => part.length > 0),
  );
  const tail = [parts.city, parts.county, parts.postalCode]
    .map((part) => part?.trim() || '')
    .filter((part) => part.length > 0 && !existing.has(part.toLowerCase()));
  return [street, ...tail].filter((part) => part.length > 0).join(', ');
}

export function normalizeTableFieldValue(
  field: string,
  raw: string,
): string | number | boolean | null {
  if (field === 'status') {
    if (!ORDER_STATUSES.has(raw)) {
      throw new BadRequestException('Invalid order status');
    }
    return raw;
  }

  if (field === 'price') {
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0.01 || value > 1_000_000) {
      throw new BadRequestException('Invalid price');
    }
    return Math.round(value * 100) / 100;
  }

  if (field === 'stockQuantity') {
    if (!/^\d+$/.test(raw.trim())) {
      throw new BadRequestException('Invalid stock quantity');
    }
    const value = Number(raw);
    if (value > 1_000_000) {
      throw new BadRequestException('Invalid stock quantity');
    }
    return value;
  }

  if (field === 'inStock') {
    if (raw !== 'true' && raw !== 'false') {
      throw new BadRequestException('Invalid stock flag');
    }
    return raw === 'true';
  }

  if (field === 'phone') {
    return raw.trim() ? raw.trim() : null;
  }

  if (field === 'deliveryAddress') {
    const trimmed = raw.trim();
    if (trimmed.length < 3 || trimmed.length > 500) {
      throw new BadRequestException('Invalid delivery address');
    }
    return trimmed;
  }

  if (field === 'customerNote') {
    const trimmed = raw.trim();
    if (trimmed.length > 1000) {
      throw new BadRequestException('Mentiunea poate avea maxim 1000 de caractere.');
    }
    return trimmed || null;
  }

  if (field === 'first_name' || field === 'last_name') {
    const trimmed = raw.trim();
    if (trimmed.length < 2 || trimmed.length > 80) {
      throw new BadRequestException('Invalid name');
    }
    return trimmed;
  }

  throw new BadRequestException('This field cannot be edited from the table');
}

export function valuesMatch(
  field: string,
  current: unknown,
  expected: string | number | boolean | null,
): boolean {
  if (field === 'price') {
    return Math.round(Number(current) * 100) === Math.round(Number(expected) * 100);
  }
  if (field === 'stockQuantity') {
    return Number(current) === Number(expected);
  }
  if (field === 'inStock') {
    return Boolean(current) === Boolean(expected);
  }
  if (field === 'phone' || field === 'customerNote') {
    const left = current == null || current === '' ? null : String(current);
    const right = expected == null || expected === '' ? null : String(expected);
    return left === right;
  }
  return String(current ?? '') === String(expected ?? '');
}
