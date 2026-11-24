import { cardPaymentMatchesOrder } from './card-payment-match.util';

const paid = {
  responseOrderId: 'MIL-abc',
  expectedOrderId: 'MIL-abc',
  responseNtpId: 'ntp-1',
  expectedNtpId: 'ntp-1',
  currency: 'RON',
  amount: 22.5,
  expectedTotal: 22.5,
  paymentStatus: 3,
};

describe('card payment match', () => {
  it('accepts a paid RON payment for the same order and amount', () => {
    expect(cardPaymentMatchesOrder(paid)).toBe(true);
  });

  it('rejects a different amount', () => {
    expect(cardPaymentMatchesOrder({ ...paid, amount: 1 })).toBe(false);
  });

  it('rejects a non-RON currency', () => {
    expect(cardPaymentMatchesOrder({ ...paid, currency: 'EUR' })).toBe(false);
  });

  it('rejects a different order id', () => {
    expect(
      cardPaymentMatchesOrder({ ...paid, responseOrderId: 'MIL-other' }),
    ).toBe(false);
  });

  it('rejects an unpaid status', () => {
    expect(cardPaymentMatchesOrder({ ...paid, paymentStatus: 1 })).toBe(false);
  });
});
