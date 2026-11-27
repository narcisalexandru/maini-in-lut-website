export const DASHBOARD_MONTH_COUNT = 12;
export const DASHBOARD_LAST_MONTHS = 3;
export const SALES_TIME_ZONE = 'Europe/Bucharest';

export type SalesBucketRow = {
  bucket: string | null;
  mugsSold: number;
  totalValueRon: number;
  customersCount: number;
};

export type SalesPoint = {
  key: string;
  mugsSold: number;
  totalValueRon: number;
  customersCount: number;
};

function readNumber(row: Record<string, unknown>, key: string): number {
  const value = row[key] ?? row[key.toLowerCase()];
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundCount(value: number): number {
  return Math.round(value);
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function recentMonthKeys(
  now = new Date(),
  count = DASHBOARD_MONTH_COUNT,
): string[] {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SALES_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now);
  let year = Number(parts.find((part) => part.type === 'year')?.value);
  let month = Number(parts.find((part) => part.type === 'month')?.value);
  const keys: string[] = [];

  for (let index = 0; index < count; index += 1) {
    keys.unshift(`${year}-${String(month).padStart(2, '0')}`);
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }

  return keys;
}

export function daysInMonth(monthKey: string): string[] {
  const [year, month] = monthKey.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Array.from({ length: lastDay }, (_, index) => {
    const day = String(index + 1).padStart(2, '0');
    return `${monthKey}-${day}`;
  });
}

export function parseSalesBucket(row: Record<string, unknown>): SalesBucketRow {
  const bucketValue = row.bucket ?? row.month ?? row.Month;
  return {
    bucket: typeof bucketValue === 'string' ? bucketValue : null,
    mugsSold: readNumber(row, 'mugsSold'),
    totalValueRon: readNumber(row, 'totalValueRon'),
    customersCount: readNumber(row, 'customersCount'),
  };
}

function emptyPoint(key: string): SalesPoint {
  return {
    key,
    mugsSold: 0,
    totalValueRon: 0,
    customersCount: 0,
  };
}

export function fillSalesPoints(
  keys: string[],
  rows: SalesBucketRow[],
): SalesPoint[] {
  const points = new Map(keys.map((key) => [key, emptyPoint(key)]));

  for (const row of rows) {
    if (!row.bucket) {
      continue;
    }
    const point = points.get(row.bucket);
    if (!point) {
      continue;
    }
    point.mugsSold += row.mugsSold;
    point.totalValueRon += row.totalValueRon;
    point.customersCount += row.customersCount;
  }

  return keys.map((key) => {
    const point = points.get(key) ?? emptyPoint(key);
    return {
      key,
      mugsSold: roundCount(point.mugsSold),
      totalValueRon: roundMoney(point.totalValueRon),
      customersCount: roundCount(point.customersCount),
    };
  });
}
