export type CartItem = { productId: number; quantity: number };

const GUEST_CART_KEY = "guest_cart";

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

  const apiBase = () =>
    import.meta.env.VITE_BACKEND_URL || useRuntimeConfig().public?.apiBase || "";

  const getToken = () => {
    if (import.meta.client) {
      return localStorage.getItem("token");
    }
    return null;
  };

  const loadGuestCart = (): CartItem[] => getGuestCartFromStorage();

  const saveGuestCart = (items: CartItem[]) => {
    if (import.meta.client) {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    }
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
          return;
        }
      } catch (e) {
        console.error("Failed to load cart:", e);
      }
      cartItems.value = [];
    } else {
      cartItems.value = loadGuestCart();
    }
  };

  const addToCart = async (productId: number, quantity = 1) => {
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
        }
      } catch (e) {
        console.error("Failed to add to cart:", e);
      }
    } else {
      const existing = cartItems.value.find((i) => i.productId === productId);
      let next: CartItem[];
      if (existing) {
        next = cartItems.value.map((i) =>
          i.productId === productId
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      } else {
        next = [...cartItems.value, { productId, quantity }];
      }
      cartItems.value = next;
      if (import.meta.client) {
        saveGuestCart(next);
      }
    }
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
          }
        );
        if (response.ok) {
          const data = await response.json();
          cartItems.value = Array.isArray(data) ? data : cartItems.value;
        }
      } catch (e) {
        console.error("Failed to remove from cart:", e);
      }
    } else {
      const next = cartItems.value.filter((i) => i.productId !== productId);
      cartItems.value = next;
      if (import.meta.client) {
        saveGuestCart(next);
      }
    }
  };

  const setQuantity = async (productId: number, quantity: number) => {
    if (quantity <= 0) {
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
            body: JSON.stringify({ quantity }),
          }
        );
        if (response.ok) {
          const data = await response.json();
          cartItems.value = Array.isArray(data) ? data : cartItems.value;
        }
      } catch (e) {
        console.error("Failed to set cart quantity:", e);
      }
    } else {
      const next = cartItems.value.map((i) =>
        i.productId === productId ? { ...i, quantity } : i
      );
      cartItems.value = next;
      if (import.meta.client) {
        saveGuestCart(next);
      }
    }
  };

  const cartCount = computed(() =>
    cartItems.value.reduce((sum, i) => sum + i.quantity, 0)
  );

  const getQuantity = (productId: number) =>
    cartItems.value.find((i) => i.productId === productId)?.quantity ?? 0;

  const mergeGuestCart = async () => {
    const token = getToken();
    if (!token) return;

    const guestItems = loadGuestCart();
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
        body: JSON.stringify({ items: guestItems }),
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

  const clearCart = () => {
    cartItems.value = [];
    if (import.meta.client) {
      localStorage.removeItem(GUEST_CART_KEY);
    }
  };

  return {
    cartItems,
    cartCount,
    loadCart,
    addToCart,
    removeFromCart,
    setQuantity,
    getQuantity,
    loadGuestCart,
    saveGuestCart,
    mergeGuestCart,
    clearCart,
  };
};
