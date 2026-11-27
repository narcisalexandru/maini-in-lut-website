import type { OrderDetail, OrderInvoice, OrderItem, OrderSummary } from "~/types/order";

type OrderListFilters = {
  paymentStatus?: string;
  itemStatus?: string;
  artistId?: number;
  userId?: number;
  archived?: boolean;
};

function buildOrderQuery(filters?: OrderListFilters) {
  const searchParams = new URLSearchParams();
  if (filters?.paymentStatus) {
    searchParams.set("paymentStatus", filters.paymentStatus);
  }
  if (filters?.itemStatus) {
    searchParams.set("itemStatus", filters.itemStatus);
  }
  if (filters?.artistId) {
    searchParams.set("artistId", String(filters.artistId));
  }
  if (filters?.userId) {
    searchParams.set("userId", String(filters.userId));
  }
  if (filters?.archived !== undefined) {
    searchParams.set("archived", String(filters.archived));
  }
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function useOrders() {
  const { apiFetch } = useApi();

  const getMyOrders = () => apiFetch<OrderSummary[]>("/users/orders");

  const getMyOrder = (id: number) =>
    apiFetch<OrderDetail>(`/users/orders/${id}`);

  const getAllOrders = (filters?: OrderListFilters) =>
    apiFetch<OrderSummary[]>(`/admin/orders${buildOrderQuery(filters)}`);

  const getAdminOrder = (id: number) =>
    apiFetch<OrderDetail>(`/admin/orders/${id}`);

  const getArtistOrders = (filters?: OrderListFilters) =>
    apiFetch<Array<OrderSummary & { items: OrderItem[] }>>(
      `/admin/orders/artist/mine${buildOrderQuery(filters)}`,
    );

  const updateOrderItemStatus = (itemId: number, status: string) =>
    apiFetch<OrderItem>(`/admin/orders/items/${itemId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });

  const archiveOrder = (orderId: number) =>
    apiFetch<OrderDetail>(`/admin/orders/${orderId}/archive`, {
      method: "PATCH",
    });

  const unarchiveOrder = (orderId: number) =>
    apiFetch<OrderDetail>(`/admin/orders/${orderId}/unarchive`, {
      method: "PATCH",
    });

  const deleteOrder = (orderId: number) =>
    apiFetch<{ id: number }>(`/admin/orders/${orderId}`, {
      method: "DELETE",
    });

  const bulkOrders = (
    action: "archive" | "unarchive" | "delete",
    orderIds: number[],
  ) =>
    apiFetch<{
      succeeded: number[];
      failed: { id: number; message: string }[];
    }>("/admin/orders/bulk", {
      method: "POST",
      body: JSON.stringify({ action, orderIds }),
    });

  const issueInvoice = (orderId: number) =>
    apiFetch<OrderInvoice>(`/admin/orders/${orderId}/invoice`, {
      method: "POST",
    });

  return {
    getMyOrders,
    getMyOrder,
    getAllOrders,
    getAdminOrder,
    getArtistOrders,
    updateOrderItemStatus,
    archiveOrder,
    unarchiveOrder,
    deleteOrder,
    bulkOrders,
    issueInvoice,
  };
}
