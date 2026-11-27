export type WorkshopPaymentMethod = "CARD" | "CASH" | "COMPLIMENTARY";

export type WorkshopPaymentStatus =
  | "PENDING"
  | "AWAITING_CASH"
  | "PAID"
  | "FAILED";

export type PublicWorkshop = {
  id: number;
  slug: string;
  title: string;
  description: string;
  fee: number;
  allowCard: boolean;
  allowCash: boolean;
  startsAt: string;
  endsAt: string | null;
  location: string;
  capacity: number;
  spotsLeft: number;
  artist: {
    id: number;
    displayName: string;
    slug: string;
  };
};

export type AdminWorkshop = PublicWorkshop & {
  artistId: number;
  published: boolean;
  bookingsCount: number;
};

export type WorkshopBookingRow = {
  id: number;
  code: string;
  spots: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod: WorkshopPaymentMethod;
  paymentStatus: WorkshopPaymentStatus;
  amount: number;
  createdAt: string;
};

export type AdminWorkshopDetail = AdminWorkshop & {
  bookings: WorkshopBookingRow[];
};

export type WorkshopFormPayload = {
  title: string;
  description: string;
  fee: number;
  allowCard: boolean;
  allowCash: boolean;
  startsAt: string;
  endsAt: string | null;
  location: string;
  capacity: number;
  published: boolean;
  artistId?: number;
};

export type WorkshopBookingResult = {
  code: string;
  paymentMethod: WorkshopPaymentMethod;
  paymentStatus: WorkshopPaymentStatus;
  url?: string;
};

export type WorkshopBookingStatus = {
  code: string;
  paymentMethod: WorkshopPaymentMethod;
  paymentStatus: WorkshopPaymentStatus;
  spots: number;
  amount: number;
  workshopTitle: string;
};
