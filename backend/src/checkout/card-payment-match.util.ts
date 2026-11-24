export const NETOPIA_STATUS_PAID = 3;
export const NETOPIA_STATUS_CONFIRMED = 5;

const AMOUNT_TOLERANCE_RON = 0.05;

export function cardPaymentMatchesOrder(input: {
  responseOrderId?: string;
  expectedOrderId: string;
  responseNtpId?: string;
  expectedNtpId: string;
  currency?: string;
  amount: number;
  expectedTotal: number;
  paymentStatus: number;
}): boolean {
  if (input.responseOrderId !== input.expectedOrderId) {
    return false;
  }
  if (input.responseNtpId && input.responseNtpId !== input.expectedNtpId) {
    return false;
  }
  if (input.currency && input.currency !== 'RON') {
    return false;
  }
  if (
    !Number.isFinite(input.amount) ||
    Math.abs(input.amount - Number(input.expectedTotal)) > AMOUNT_TOLERANCE_RON
  ) {
    return false;
  }
  return (
    input.paymentStatus === NETOPIA_STATUS_PAID ||
    input.paymentStatus === NETOPIA_STATUS_CONFIRMED
  );
}
