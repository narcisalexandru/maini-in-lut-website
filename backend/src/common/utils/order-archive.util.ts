import { OrderItemStatus } from '../enums/order-status.enum';
import { SelectQueryBuilder } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';

export const TERMINAL_ORDER_ITEM_STATUSES = [
  OrderItemStatus.DELIVERED,
  OrderItemStatus.CANCELLED,
] as const;

export function applyActiveOrdersFilter(
  qb: SelectQueryBuilder<Order>,
  artistId?: number,
): void {
  if (artistId) {
    qb.andWhere(
      `EXISTS (
        SELECT 1 FROM order_item active_item
        WHERE active_item."orderId" = "order".id
          AND active_item."artistId" = :archiveArtistId
          AND (
            active_item.status NOT IN (:...terminalStatuses)
            OR active_item."isUnarchived" = true
          )
      )`,
      {
        archiveArtistId: artistId,
        terminalStatuses: TERMINAL_ORDER_ITEM_STATUSES,
      },
    );
    return;
  }

  qb.andWhere(
    `EXISTS (
      SELECT 1 FROM order_item active_item
      WHERE active_item."orderId" = "order".id
        AND (
          active_item.status NOT IN (:...terminalStatuses)
          OR active_item."isUnarchived" = true
        )
    )`,
    { terminalStatuses: TERMINAL_ORDER_ITEM_STATUSES },
  );
}

export function applyArchivedOrdersFilter(
  qb: SelectQueryBuilder<Order>,
  artistId?: number,
): void {
  if (artistId) {
    qb.andWhere(
      `EXISTS (
        SELECT 1 FROM order_item artist_item
        WHERE artist_item."orderId" = "order".id
          AND artist_item."artistId" = :archiveArtistId
      )`,
      { archiveArtistId: artistId },
    );
    qb.andWhere(
      `NOT EXISTS (
        SELECT 1 FROM order_item open_item
        WHERE open_item."orderId" = "order".id
          AND open_item."artistId" = :archiveArtistId
          AND (
            open_item.status NOT IN (:...terminalStatuses)
            OR open_item."isUnarchived" = true
          )
      )`,
      {
        archiveArtistId: artistId,
        terminalStatuses: TERMINAL_ORDER_ITEM_STATUSES,
      },
    );
    return;
  }

  qb.andWhere(
    `NOT EXISTS (
      SELECT 1 FROM order_item open_item
      WHERE open_item."orderId" = "order".id
        AND (
          open_item.status NOT IN (:...terminalStatuses)
          OR open_item."isUnarchived" = true
        )
    )`,
    { terminalStatuses: TERMINAL_ORDER_ITEM_STATUSES },
  );
}
