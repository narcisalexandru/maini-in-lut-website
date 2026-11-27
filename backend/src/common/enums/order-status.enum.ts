export enum OrderPaymentStatus {
  PENDING = 'PENDING',
  AWAITING_CASH = 'AWAITING_CASH',
  PAID = 'PAID',
  FAILED = 'FAILED',
}

export enum PaymentMethod {
  CARD = 'CARD',
  CASH = 'CASH',
}

export enum OrderItemStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}
