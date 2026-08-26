export type OrderItemStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type OrderPaymentStatus = "PENDING" | "PAID" | "FAILED";
export type PaymentMethod = "CARD" | "CASH";

export interface ArtistOrderStatus {
  artistId: number;
  artistDisplayName: string;
  status: OrderItemStatus;
}

export interface OrderSummary {
  id: number;
  publicOrderNumber: string;
  userId: number | null;
  paymentMethod: PaymentMethod;
  paymentStatus: OrderPaymentStatus;
  totalRon: number;
  itemCount: number;
  artistStatuses: ArtistOrderStatus[];
  createdAt: string;
}

export interface OrderItem {
  id: number;
  productId: number;
  artistId: number;
  artistDisplayName: string;
  title: string;
  image: string | null;
  quantity: number;
  unitPriceRon: number;
  lineTotalRon: number;
  status: OrderItemStatus;
  statusUpdatedAt: string | null;
  isUnarchived?: boolean;
}

export interface OrderDetail extends OrderSummary {
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  delivery: {
    county: string;
    city: string;
    street: string;
    postalCode: string;
    recipientName: string | null;
    recipientPhone: string | null;
  };
  billingDetails: Record<string, unknown> | null;
  subtotalRon: number;
  deliveryFeeRon: number;
  cashOperationalFeeRon: number;
  items: OrderItem[];
  updatedAt: string;
}
