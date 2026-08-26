import { clampTotalCartQuantity } from "~/utils/product-stock";
import {
  buildGuestCartHeaders,
  getGuestCartId,
  getOrCreateGuestCartId,
} from "~/utils/guest-cart-id";
import { getApiBaseUrl } from "~/utils/api-base";

export type CartItem = { productId: number; quantity: number };

const GUEST_CART_KEY = "guest_cart";
const RESERVATION_TTL_MS = 10 * 60 * 1000;

function getGuestCartFromStorage(): CartItem[] {
  if (import.meta.client) {
    try {
      const stored = localStorage.getItem(GUEST_CART_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CartItem[];
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      // ignore
    }
  }
  return [];
}

export const useCart = () => {
  const cartItems = useState<CartItem[]>("cart", () => []);
  const reservationExpiresAt = useState<string | null>(
    "cart-reservation-expires-at",
    () => null,
  );

  const apiBase = () => getApiBaseUrl();

  const getToken = () => {
    if (import.meta.client) {
      return localStorage.getItem("token");
    }
    return null;
  };

  const useGuestFlow = () => {
    if (!import.meta.client) {
      return;
    }
    localStorage.removeItem("token");
  };

  const loadGuestCart = (): CartItem[] => getGuestCartFromStorage();

  const saveGuestCart = (items: CartItem[]) => {
    if (import.meta.client) {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    }
  };

  const syncGuestReservations = async (
    items: CartItem[],
  ): Promise<CartItem[]> => {
    if (!import.meta.client) {
      return items;
    }

    const guestId = getOrCreateGuestCartId();
    try {
      const response = await fetch(`${apiBase()}/cart/guest/reservations`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId, items }),
      });
      if (!response.ok) {
        cartItems.value = items;
        saveGuestCart(items);
        return items;
      }
      const data = await response.json();
      const synced = Array.isArray(data.items) ? data.items : items;
      cartItems.value = synced;
      saveGuestCart(synced);
      reservationExpiresAt.value =
        typeof data.expiresAt === "string" ? data.expiresAt : null;
      return synced;
    } catch (error) {
      console.error("Failed to sync guest stock reservations:", error);
      cartItems.value = items;
      saveGuestCart(items);
      return items;
    }
  };

  const releaseGuestReservations = async () => {
    await syncGuestReservations([]);
    reservationExpiresAt.value = null;
  };

  const loadCart = async () => {
    const token = getToken();
    if (token) {
      try {
        const response = await fetch(`${apiBase()}/users/cart`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          cartItems.value = Array.isArray(data) ? data : [];
          reservationExpiresAt.value = null;
          return;
        }
        if (response.status === 401 || response.status === 403) {
          useGuestFlow();
        }
      } catch (e) {
        console.error("Failed to load cart:", e);
      }
      const guestItems = loadGuestCart();
      cartItems.value = guestItems;
      if (guestItems.length > 0) {
        await syncGuestReservations(guestItems);
      }
    } else {
      const guestItems = loadGuestCart();
      cartItems.value = guestItems;
      if (guestItems.length > 0) {
        await syncGuestReservations(guestItems);
      }
    }
  };

  const addToCart = async (
    productId: number,
    quantity = 1,
    maxTotalQuantity?: number,
  ) => {
    const token = getToken();
    if (token) {
      try {
        const response = await fetch(`${apiBase()}/users/cart/items`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId, quantity }),
        });
        if (response.ok) {
          const data = await response.json();
          cartItems.value = Array.isArray(data) ? data : cartItems.value;
          reservationExpiresAt.value = new Date(
            Date.now() + RESERVATION_TTL_MS,
          ).toISOString();
          return;
        }
        if (response.status === 401 || response.status === 403) {
          useGuestFlow();
        }
      } catch (e) {
        console.error("Failed to add to cart:", e);
      }
    }

    const existing = cartItems.value.find((i) => i.productId === productId);
    const desiredTotal = (existing?.quantity ?? 0) + quantity;
    const cappedTotal =
      maxTotalQuantity !== undefined
        ? clampTotalCartQuantity(desiredTotal, maxTotalQuantity)
        : desiredTotal;

    if (cappedTotal <= 0) {
      return;
    }

    let next: CartItem[];
    if (existing) {
      if (cappedTotal === existing.quantity) {
        return;
      }
      next = cartItems.value.map((i) =>
        i.productId === productId ? { ...i, quantity: cappedTotal } : i,
      );
    } else {
      next = [...cartItems.value, { productId, quantity: cappedTotal }];
    }

    await syncGuestReservations(next);
  };

  const removeFromCart = async (productId: number) => {
    const token = getToken();
    if (token) {
      try {
        const response = await fetch(
          `${apiBase()}/users/cart/items/${productId}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (response.ok) {
          const data = await response.json();
          cartItems.value = Array.isArray(data) ? data : cartItems.value;
          return;
        }
        if (response.status === 401 || response.status === 403) {
          useGuestFlow();
        }
      } catch (e) {
        console.error("Failed to remove from cart:", e);
      }
    }

    const next = cartItems.value.filter((i) => i.productId !== productId);
    await syncGuestReservations(next);
  };

  const setQuantity = async (
    productId: number,
    quantity: number,
    maxQuantity?: number,
  ) => {
    let nextQuantity = quantity;
    if (maxQuantity !== undefined) {
      nextQuantity = clampTotalCartQuantity(quantity, maxQuantity);
    }

    if (nextQuantity <= 0) {
      await removeFromCart(productId);
      return;
    }
    const token = getToken();
    if (token) {
      try {
        const response = await fetch(
          `${apiBase()}/users/cart/items/${productId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ quantity: nextQuantity }),
          },
        );
        if (response.ok) {
          const data = await response.json();
          cartItems.value = Array.isArray(data) ? data : cartItems.value;
          reservationExpiresAt.value = new Date(
            Date.now() + RESERVATION_TTL_MS,
          ).toISOString();
          return;
        }
        if (response.status === 401 || response.status === 403) {
          useGuestFlow();
        }
      } catch (e) {
        console.error("Failed to set cart quantity:", e);
      }
    }

    const next = cartItems.value.map((i) =>
      i.productId === productId ? { ...i, quantity: nextQuantity } : i,
    );
    await syncGuestReservations(next);
  };

  const cartCount = computed(() =>
    cartItems.value.reduce((sum, i) => sum + i.quantity, 0),
  );

  const getQuantity = (productId: number) =>
    cartItems.value.find((i) => i.productId === productId)?.quantity ?? 0;

  const mergeGuestCart = async () => {
    const token = getToken();
    if (!token) return;

    const guestItems = loadGuestCart();
    const guestId = getGuestCartId();
    if (guestItems.length === 0) {
      await loadCart();
      return;
    }

    try {
      const response = await fetch(`${apiBase()}/users/cart/merge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items: guestItems, guestId }),
      });
      if (response.ok) {
        if (import.meta.client) {
          localStorage.removeItem(GUEST_CART_KEY);
        }
        await loadCart();
      }
    } catch (e) {
      console.error("Failed to merge cart:", e);
    }
  };

  const clearCart = async () => {
    cartItems.value = [];
    if (import.meta.client) {
      localStorage.removeItem(GUEST_CART_KEY);
    }
    reservationExpiresAt.value = null;
    if (!getToken()) {
      await releaseGuestReservations();
    }
  };

  const refreshGuestReservations = async () => {
    if (getToken()) {
      return;
    }
    if (cartItems.value.length === 0) {
      return;
    }
    await syncGuestReservations(cartItems.value);
  };

  return {
    cartItems,
    cartCount,
    reservationExpiresAt,
    loadCart,
    addToCart,
    removeFromCart,
    setQuantity,
    getQuantity,
    loadGuestCart,
    saveGuestCart,
    mergeGuestCart,
    clearCart,
    refreshGuestReservations,
    getGuestCartId: getOrCreateGuestCartId,
    buildGuestCartHeaders,
  };
};
