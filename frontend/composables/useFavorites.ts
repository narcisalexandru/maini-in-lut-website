import { apiRequest } from "~/utils/api-request";

const GUEST_FAVORITES_KEY = "guest_favorites";

function getGuestFavoritesFromStorage(): number[] {
  if (import.meta.client) {
    try {
      const stored = localStorage.getItem(GUEST_FAVORITES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as number[];
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      // ignore
    }
  }
  return [];
}

export const useFavorites = () => {
  const favoriteIds = useState<number[]>("favorites", () => []);

  const { isAuthenticated, clearAuthData } = useAuthState();

  if (import.meta.client && favoriteIds.value.length === 0) {
    if (!isAuthenticated.value) {
      const guest = getGuestFavoritesFromStorage();
      if (guest.length > 0) {
        favoriteIds.value = guest;
      }
    }
  }

  const getToken = () =>
    import.meta.client && isAuthenticated.value ? "cookie" : null;

  const useGuestFlow = () => {
    void apiRequest("/auth/logout", { method: "POST" }).catch(() => undefined);
    clearAuthData();
  };

  const loadGuestFavorites = (): number[] => getGuestFavoritesFromStorage();

  const saveGuestFavorites = (ids: number[]) => {
    if (import.meta.client) {
      localStorage.setItem(GUEST_FAVORITES_KEY, JSON.stringify(ids));
    }
  };

  const loadFavorites = async () => {
    const token = getToken();
    if (token) {
      try {
        const response = await apiRequest("/users/favorites");
        if (response.ok) {
          const ids = await response.json();
          favoriteIds.value = Array.isArray(ids) ? ids : [];
          return;
        }
        if (response.status === 401 || response.status === 403) {
          useGuestFlow();
        }
      } catch (e) {
        console.error("Failed to load favorites:", e);
      }
      favoriteIds.value = loadGuestFavorites();
    } else {
      favoriteIds.value = loadGuestFavorites();
    }
  };

  const addFavorite = async (productId: number) => {
    const token = getToken();
    if (token) {
      try {
        const response = await apiRequest(`/users/favorites/${productId}`, {
          method: "POST",
        });
        if (response.ok && !favoriteIds.value.includes(productId)) {
          favoriteIds.value = [...favoriteIds.value, productId];
          return;
        }
        if (response.status === 401 || response.status === 403) {
          useGuestFlow();
        }
      } catch (e) {
        console.error("Failed to add favorite:", e);
      }
    }

    if (!favoriteIds.value.includes(productId)) {
      const next = [...favoriteIds.value, productId];
      favoriteIds.value = next;
      saveGuestFavorites(next);
    }
  };

  const removeFavorite = async (productId: number) => {
    const token = getToken();
    if (token) {
      try {
        const response = await apiRequest(`/users/favorites/${productId}`, {
          method: "DELETE",
        });
        if (response.ok) {
          favoriteIds.value = favoriteIds.value.filter((id) => id !== productId);
          return;
        }
        if (response.status === 401 || response.status === 403) {
          useGuestFlow();
        }
      } catch (e) {
        console.error("Failed to remove favorite:", e);
      }
    }

    const next = favoriteIds.value.filter((id) => id !== productId);
    favoriteIds.value = next;
    saveGuestFavorites(next);
  };

  const toggleFavorite = async (productId: number) => {
    if (isFavorite(productId)) {
      await removeFavorite(productId);
    } else {
      await addFavorite(productId);
    }
  };

  const isFavorite = (productId: number) => favoriteIds.value.includes(productId);

  const favoritesCount = computed(() => favoriteIds.value.length);

  const mergeGuestFavorites = async () => {
    const token = getToken();
    if (!token) return;

    const guestIds = loadGuestFavorites();
    if (guestIds.length === 0) {
      await loadFavorites();
      return;
    }

    try {
      const response = await apiRequest("/users/favorites/merge", {
        method: "POST",
        body: JSON.stringify({ productIds: guestIds }),
      });
      if (response.ok) {
        if (import.meta.client) {
          localStorage.removeItem(GUEST_FAVORITES_KEY);
        }
        await loadFavorites();
      }
    } catch (e) {
      console.error("Failed to merge favorites:", e);
    }
  };

  return {
    favoriteIds,
    favoritesCount,
    loadFavorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    mergeGuestFavorites,
  };
};
