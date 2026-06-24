import { computed } from "vue";
import type { AuthUser } from "~/types/user";
import { useAuthState } from "./useAuthState";

interface AuthError {
  message: string;
  field?: string;
}

export const useAuth = () => {
  const router = useRouter();
  const { locale, t } = useI18n();
  const {
    isLoading,
    error,
    user,
    isAuthenticated,
    syncFromStorage,
    setAuthData,
    clearAuthData,
  } = useAuthState();

  const userRole = computed(() => user.value.role || "CLIENT");
  const isSuperAdmin = computed(() => userRole.value === "SUPER_ADMIN");
  const isArtist = computed(() => userRole.value === "ARTIST");
  const canAccessAdmin = computed(
    () => isSuperAdmin.value || isArtist.value,
  );

  const handleAuthError = (err: unknown): AuthError => {
    console.error("Authentication error:", err);
    const errorMessage =
      err instanceof Error
        ? err.message
        : "An error occurred during authentication";
    error.value = { message: errorMessage };
    return error.value;
  };

  const login = async (email: string, password: string) => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (!data.access_token) {
        throw new Error("No access token received");
      }

      setAuthData(data);
      return { success: true as const, data };
    } catch (err) {
      const authError = handleAuthError(err);
      return { success: false as const, error: authError };
    } finally {
      isLoading.value = false;
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    county: string;
    city: string;
    street: string;
    postal_code: string;
    phone: string;
  }) => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        if (data.message === "Email already exists") {
          error.value = {
            message: t("email-already-exists"),
            field: "email",
          };
          throw error.value;
        }
        if (data.message === "Phone number already exists") {
          error.value = {
            message: t("phone-already-exists"),
            field: "phone",
          };
          throw error.value;
        }
        throw new Error(data.message || "Registration failed");
      }

      setAuthData(data);
      const { mergeGuestCart } = useCart();
      await mergeGuestCart();
      router.push(
        locale.value === "en"
          ? "/en/auth/email-verification"
          : "/auth/email-verification",
      );
      return { success: true as const, data };
    } catch (err) {
      if (err instanceof Error) {
        return handleAuthError(err);
      }
      return err as AuthError;
    } finally {
      isLoading.value = false;
    }
  };

  const googleAuth = () => {
    window.location.href = `${import.meta.env.VITE_BACKEND_URL}/auth/google`;
  };

  const checkAuth = () => {
    if (syncFromStorage()) {
      return true;
    }

    isAuthenticated.value = false;
    const loginPath = locale.value === "en" ? "/en/login" : "/login";
    router.push(loginPath);
    return false;
  };

  const loadUser = async () => {
    try {
      syncFromStorage();

      const token = localStorage.getItem("token");
      if (!token) {
        isAuthenticated.value = false;
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/users/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        if (response.status === 401) {
          clearAuthData();
        }
        return;
      }

      const userData = await response.json();
      user.value = userData;
      isAuthenticated.value = true;
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (loadError) {
      console.error("Error loading user data:", loadError);
    }
  };

  const logout = () => {
    clearAuthData();
    const { loadFavorites } = useFavorites();
    const { clearCart } = useCart();
    loadFavorites();
    clearCart();
    const loginPath = locale.value === "en" ? "/en/login" : "/login";
    router.push(loginPath);
  };

  const updateProfile = async (updateData: Partial<AuthUser>) => {
    try {
      isLoading.value = true;
      error.value = null;

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/users/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Profile update failed");
      }

      const updatedUser = { ...user.value, ...data };
      user.value = updatedUser;
      localStorage.setItem("user", JSON.stringify(updatedUser));

      return { success: true as const, data: updatedUser };
    } catch (err) {
      const authError = handleAuthError(err);
      return { success: false as const, error: authError };
    } finally {
      isLoading.value = false;
    }
  };

  return {
    user,
    isAuthenticated,
    userRole,
    isSuperAdmin,
    isArtist,
    canAccessAdmin,
    syncFromStorage,
    checkAuth,
    loadUser,
    logout,
    login,
    register,
    googleAuth,
    isLoading,
    error,
    updateProfile,
  };
};
