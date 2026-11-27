import { BadRequestException } from '@nestjs/common';
import {
  WorkshopPaymentMethod,
  WorkshopPaymentStatus,
} from './enums/workshop-payment.enum';
import {
  assertChosenPayment,
  assertPaymentSetup,
  bookingHoldsSeats,
  occupiedSpots,
} from './workshop-booking.util';

describe('workshop booking rules', () => {
  const now = new Date('2026-06-01T12:00:00.000Z');

  it('requires at least one payment method', () => {
    expect(() => assertPaymentSetup(false, false, 50)).toThrow(BadRequestException);
  });

  it('rejects a card option when the fee is zero', () => {
    expect(() => assertPaymentSetup(true, false, 0)).toThrow(BadRequestException);
    expect(() => assertPaymentSetup(false, true, 0)).not.toThrow();
  });

  it('accepts only the methods the workshop enabled', () => {
    expect(() =>
      assertChosenPayment(true, false, WorkshopPaymentMethod.CASH),
    ).toThrow(BadRequestException);
    expect(() =>
      assertChosenPayment(true, false, WorkshopPaymentMethod.CARD),
    ).not.toThrow();
  });

  it('keeps paid and cash seats, and only recent card holds', () => {
    const bookings = [
      seat(2, WorkshopPaymentStatus.PAID, WorkshopPaymentMethod.CARD, minutesAgo(5)),
      seat(1, WorkshopPaymentStatus.AWAITING_CASH, WorkshopPaymentMethod.CASH, minutesAgo(90)),
      seat(3, WorkshopPaymentStatus.PENDING, WorkshopPaymentMethod.CARD, minutesAgo(5)),
      seat(4, WorkshopPaymentStatus.PENDING, WorkshopPaymentMethod.CARD, minutesAgo(30)),
      seat(2, WorkshopPaymentStatus.FAILED, WorkshopPaymentMethod.CARD, minutesAgo(1)),
      seat(2, WorkshopPaymentStatus.PAID, WorkshopPaymentMethod.COMPLIMENTARY, minutesAgo(10)),
    ];
    expect(occupiedSpots(bookings, now)).toBe(8);
    expect(bookingHoldsSeats(bookings[3], now)).toBe(false);
  });

  function seat(
    spots: number,
    status: WorkshopPaymentStatus,
    paymentMethod: WorkshopPaymentMethod,
    createdAt: Date,
  ) {
    return { spots, status, paymentMethod, createdAt };
  }

  function minutesAgo(minutes: number): Date {
    return new Date(now.getTime() - minutes * 60 * 1000);
  }
});
