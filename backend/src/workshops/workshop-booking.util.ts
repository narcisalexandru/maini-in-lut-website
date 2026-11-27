import { BadRequestException } from '@nestjs/common';
import {
  WorkshopPaymentMethod,
  WorkshopPaymentStatus,
} from './enums/workshop-payment.enum';

export const CARD_SEAT_HOLD_MS = 20 * 60 * 1000;

export type SeatBooking = {
  spots: number;
  status: WorkshopPaymentStatus;
  paymentMethod: WorkshopPaymentMethod;
  createdAt: Date;
};

export function bookingHoldsSeats(booking: SeatBooking, now: Date): boolean {
  if (
    booking.status === WorkshopPaymentStatus.PAID ||
    booking.status === WorkshopPaymentStatus.AWAITING_CASH
  ) {
    return true;
  }
  if (
    booking.status !== WorkshopPaymentStatus.PENDING ||
    booking.paymentMethod !== WorkshopPaymentMethod.CARD
  ) {
    return false;
  }
  return now.getTime() - booking.createdAt.getTime() < CARD_SEAT_HOLD_MS;
}

export function occupiedSpots(bookings: SeatBooking[], now: Date): number {
  return bookings.reduce(
    (sum, booking) => sum + (bookingHoldsSeats(booking, now) ? booking.spots : 0),
    0,
  );
}

export function assertPaymentSetup(
  allowCard: boolean,
  allowCash: boolean,
  fee: number,
): void {
  if (!allowCard && !allowCash) {
    throw new BadRequestException(
      'Alege cel puțin o metodă de plată: card sau numerar la locație.',
    );
  }
  if (allowCard && fee <= 0) {
    throw new BadRequestException(
      'Taxa trebuie să fie mai mare decât 0 când plata cu cardul este activă.',
    );
  }
}

export function assertChosenPayment(
  allowCard: boolean,
  allowCash: boolean,
  method: WorkshopPaymentMethod,
): void {
  const allowed =
    (method === WorkshopPaymentMethod.CARD && allowCard) ||
    (method === WorkshopPaymentMethod.CASH && allowCash);
  if (!allowed) {
    throw new BadRequestException(
      'Această metodă de plată nu este disponibilă pentru atelier.',
    );
  }
}
