import { formatPublicOrderNumber } from './public-order-number.util';

describe('formatPublicOrderNumber', () => {
  it('starts at MIL-00001 and keeps growing past five digits', () => {
    expect(formatPublicOrderNumber(1)).toBe('MIL-00001');
    expect(formatPublicOrderNumber(42)).toBe('MIL-00042');
    expect(formatPublicOrderNumber(100000)).toBe('MIL-100000');
  });
});
