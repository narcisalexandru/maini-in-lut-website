import type {
  AdminWorkshop,
  AdminWorkshopDetail,
  PublicWorkshop,
  WorkshopBookingResult,
  WorkshopBookingStatus,
  WorkshopFormPayload,
  WorkshopPaymentMethod,
} from "~/types/workshop";

export function useWorkshops() {
  const { apiFetch } = useApi();

  const listPublic = () =>
    apiFetch<PublicWorkshop[]>("/workshops", { auth: false });

  const getPublic = (slug: string) =>
    apiFetch<PublicWorkshop>(`/workshops/${slug}`, { auth: false });

  const book = (
    slug: string,
    payload: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      spots: number;
      paymentMethod: WorkshopPaymentMethod;
      successUrl: string;
      cancelUrl: string;
    },
  ) =>
    apiFetch<WorkshopBookingResult>(`/workshops/${slug}/bookings`, {
      method: "POST",
      body: JSON.stringify(payload),
      auth: false,
    });

  const bookingStatus = (code: string) =>
    apiFetch<WorkshopBookingStatus>(`/workshops/bookings/${code}`, {
      auth: false,
    });

  const listAdmin = () => apiFetch<AdminWorkshop[]>("/admin/workshops");

  const getAdmin = (id: number) =>
    apiFetch<AdminWorkshopDetail>(`/admin/workshops/${id}`);

  const create = (payload: WorkshopFormPayload) =>
    apiFetch<AdminWorkshopDetail>("/admin/workshops", {
      method: "POST",
      body: JSON.stringify(payload),
    });

  const update = (id: number, payload: WorkshopFormPayload) =>
    apiFetch<AdminWorkshopDetail>(`/admin/workshops/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });

  const remove = (id: number) =>
    apiFetch<{ deleted: boolean }>(`/admin/workshops/${id}`, {
      method: "DELETE",
    });

  const reserveSeats = (id: number, spots: number) =>
    apiFetch<AdminWorkshopDetail>(`/admin/workshops/${id}/reservations`, {
      method: "POST",
      body: JSON.stringify({ spots }),
    });

  const updateReservation = (id: number, bookingId: number, spots: number) =>
    apiFetch<AdminWorkshopDetail>(`/admin/workshops/${id}/reservations/${bookingId}`, {
      method: "PUT",
      body: JSON.stringify({ spots }),
    });

  return {
    listPublic,
    getPublic,
    book,
    bookingStatus,
    listAdmin,
    getAdmin,
    create,
    update,
    remove,
    reserveSeats,
    updateReservation,
  };
}
