const GUEST_CART_ID_KEY = "guest_cart_id";

export function getOrCreateGuestCartId(): string {
  if (!import.meta.client) {
    return "";
  }

  const existing = localStorage.getItem(GUEST_CART_ID_KEY);
  if (existing?.trim()) {
    return existing.trim();
  }

  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  localStorage.setItem(GUEST_CART_ID_KEY, id);
  return id;
}

export function getGuestCartId(): string | null {
  if (!import.meta.client) {
    return null;
  }
  return localStorage.getItem(GUEST_CART_ID_KEY);
}

export function buildGuestCartHeaders(): Record<string, string> {
  const guestId = getGuestCartId();
  return guestId ? { "X-Guest-Cart-Id": guestId } : {};
}
