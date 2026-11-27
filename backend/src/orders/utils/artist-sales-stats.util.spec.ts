import {
  daysInMonth,
  fillSalesPoints,
  parseSalesBucket,
  recentMonthKeys,
} from './artist-sales-stats.util';

describe('artist sales stats', () => {
  it('builds the last 12 months in Europe/Bucharest', () => {
    expect(recentMonthKeys(new Date('2026-11-26T10:00:00Z'))).toEqual([
      '2025-12',
      '2026-01',
      '2026-02',
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
      '2026-11',
    ]);
    expect(recentMonthKeys(new Date('2026-10-31T22:30:00Z'), 3)).toEqual([
      '2026-09',
      '2026-10',
      '2026-11',
    ]);
  });

  it('lists every day of the selected month', () => {
    const days = daysInMonth('2026-11');
    expect(days).toHaveLength(30);
    expect(days[0]).toBe('2026-11-01');
    expect(days[29]).toBe('2026-11-30');
    expect(daysInMonth('2026-02')).toHaveLength(28);
  });

  it('reads numeric strings returned by Postgres', () => {
    expect(
      parseSalesBucket({
        bucket: '2026-11-04',
        mugsSold: '3',
        totalValueRon: '150.50',
        customersCount: '2',
      }),
    ).toEqual({
      bucket: '2026-11-04',
      mugsSold: 3,
      totalValueRon: 150.5,
      customersCount: 2,
    });
  });

  it('fills missing days and keeps buckets outside the period out', () => {
    const points = fillSalesPoints(
      ['2026-11-01', '2026-11-02'],
      [
        {
          bucket: '2026-11-02',
          mugsSold: 3,
          totalValueRon: 150.126,
          customersCount: 2,
        },
        {
          bucket: '2026-10-31',
          mugsSold: 9,
          totalValueRon: 90,
          customersCount: 1,
        },
      ],
    );

    expect(points).toEqual([
      {
        key: '2026-11-01',
        mugsSold: 0,
        totalValueRon: 0,
        customersCount: 0,
      },
      {
        key: '2026-11-02',
        mugsSold: 3,
        totalValueRon: 150.13,
        customersCount: 2,
      },
    ]);
  });
});
