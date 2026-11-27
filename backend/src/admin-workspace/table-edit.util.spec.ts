import { BadRequestException } from '@nestjs/common';
import {
  composeDeliveryAddress,
  normalizeTableFieldValue,
  sequencesToDrop,
  valuesMatch,
} from './table-edit.util';

describe('sequencesToDrop', () => {
  it('keeps every sequence until the cap is passed', () => {
    expect(sequencesToDrop([1, 2, 3], 3)).toEqual([]);
  });

  it('drops the oldest sequences once the cap is exceeded', () => {
    expect(sequencesToDrop([4, 1, 3, 2, 5], 3)).toEqual([1, 2]);
  });
});

describe('valuesMatch', () => {
  it('compares decimal prices by cents', () => {
    expect(valuesMatch('price', '12.50', 12.5)).toBe(true);
    expect(valuesMatch('price', '12.51', 12.5)).toBe(false);
  });

  it('keeps city in the address until it is already part of the street', () => {
    expect(
      composeDeliveryAddress({
        street: 'Strada Lalelelor 4',
        city: 'Cluj-Napoca',
        county: 'Cluj',
        postalCode: '400000',
      }),
    ).toBe('Strada Lalelelor 4, Cluj-Napoca, Cluj, 400000');
    expect(
      composeDeliveryAddress({
        street: 'Easybox: #12 Locker, Cluj-Napoca',
        city: 'Cluj-Napoca',
        county: 'Cluj',
        postalCode: '400000',
      }),
    ).toBe('Easybox: #12 Locker, Cluj-Napoca, Cluj, 400000');
  });

  it('treats an empty phone as null', () => {
    expect(valuesMatch('phone', null, null)).toBe(true);
    expect(valuesMatch('phone', '', null)).toBe(true);
    expect(valuesMatch('phone', '0712345678', null)).toBe(false);
  });

  it('treats a blank order note as cleared', () => {
    expect(normalizeTableFieldValue('customerNote', '  ')).toBeNull();
    expect(normalizeTableFieldValue('customerNote', '  Lasă la ușă  ')).toBe('Lasă la ușă');
    expect(valuesMatch('customerNote', null, null)).toBe(true);
    expect(valuesMatch('customerNote', '', null)).toBe(true);
    expect(valuesMatch('customerNote', 'Lasă la ușă', null)).toBe(false);
  });

  it('rejects an order note longer than 1000 characters', () => {
    expect(() => normalizeTableFieldValue('customerNote', 'a'.repeat(1001))).toThrow(
      BadRequestException,
    );
  });
});
