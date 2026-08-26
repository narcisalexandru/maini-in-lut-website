import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  return typeof value === 'number' ? value : parseFloat(value);
}

export function toOrderItemResponse(item: OrderItem) {
  return {
    id: item.id,
    productId: item.productId,
    artistId: item.artistId,
    artistDisplayName: item.artistDisplayName,
    title: item.title,
    image: item.image,
    quantity: item.quantity,
    unitPriceRon: toNumber(item.unitPriceRon),
    lineTotalRon: toNumber(item.lineTotalRon),
    status: item.status,
    statusUpdatedAt: item.statusUpdatedAt,
    isUnarchived: item.isUnarchived,
  };
}

export function toOrderSummaryResponse(order: Order) {
  const items = order.items ?? [];
  const artistStatuses = summarizeArtistStatuses(items);

  return {
    id: order.id,
    publicOrderNumber: order.publicOrderNumber,
    userId: order.userId,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    totalRon: toNumber(order.totalRon),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    artistStatuses,
    createdAt: order.createdAt,
  };
}

export function toOrderDetailResponse(order: Order) {
  const items = (order.items ?? []).map(toOrderItemResponse);
  const artistStatuses = summarizeArtistStatuses(order.items ?? []);

  return {
    id: order.id,
    publicOrderNumber: order.publicOrderNumber,
    userId: order.userId,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    customer: {
      firstName: order.customerFirstName,
      lastName: order.customerLastName,
      email: order.customerEmail,
      phone: order.customerPhone,
    },
    delivery: {
      county: order.deliveryCounty,
      city: order.deliveryCity,
      street: order.deliveryStreet,
      postalCode: order.deliveryPostalCode,
      recipientName: order.deliveryRecipientName,
      recipientPhone: order.deliveryRecipientPhone,
    },
    billingDetails: order.billingDetails,
    subtotalRon: toNumber(order.subtotalRon),
    deliveryFeeRon: toNumber(order.deliveryFeeRon),
    cashOperationalFeeRon: toNumber(order.cashOperationalFeeRon),
    totalRon: toNumber(order.totalRon),
    artistStatuses,
    items,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

function summarizeArtistStatuses(items: OrderItem[]) {
  const byArtist = new Map<
    number,
    { artistId: number; artistDisplayName: string; statuses: Set<string> }
  >();

  for (const item of items) {
    const existing = byArtist.get(item.artistId);
    if (existing) {
      existing.statuses.add(item.status);
      continue;
    }
    byArtist.set(item.artistId, {
      artistId: item.artistId,
      artistDisplayName: item.artistDisplayName,
      statuses: new Set([item.status]),
    });
  }

  return Array.from(byArtist.values()).map((entry) => ({
    artistId: entry.artistId,
    artistDisplayName: entry.artistDisplayName,
    status: resolveAggregateStatus(entry.statuses),
  }));
}

function resolveAggregateStatus(statuses: Set<string>): string {
  if (statuses.has('CANCELLED') && statuses.size === 1) {
    return 'CANCELLED';
  }
  if (statuses.has('PENDING')) {
    return 'PENDING';
  }
  if (statuses.has('PROCESSING')) {
    return 'PROCESSING';
  }
  if (statuses.has('SHIPPED')) {
    return 'SHIPPED';
  }
  if (statuses.size === 1 && statuses.has('DELIVERED')) {
    return 'DELIVERED';
  }
  return 'PROCESSING';
}
