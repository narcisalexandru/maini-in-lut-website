import { Product } from '../../products/entities/product.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';
import { Artist } from '../../artists/entities/artist.entity';

export function productAuditContext(product: Product) {
  return {
    relatedArtistId: product.artistId,
    relatedArtistName: product.artist?.displayName ?? null,
    targetId: product.id,
    targetLabel: product.title,
  };
}

export function orderItemAuditContext(item: OrderItem) {
  return {
    relatedArtistId: item.artistId,
    relatedArtistName: item.artistDisplayName,
    targetId: item.id,
    targetLabel: `${item.title} (${item.order?.publicOrderNumber ?? item.orderId})`,
  };
}

export function artistAuditContext(artist: Artist) {
  return {
    relatedArtistId: artist.id,
    relatedArtistName: artist.displayName,
    targetId: artist.id,
    targetLabel: artist.displayName,
  };
}
