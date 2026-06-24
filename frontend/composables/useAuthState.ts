import type { AuthUser } from "~/types/user";

export interface AuthResponse {
  access_token: string;
  user: AuthUser;
}

export const createEmptyUser = (): AuthUser => ({
  id: 0,
  email: "",
  first_name: "",
  last_name: "",
  county: "",
  city: "",
  street: "",
  postal_code: "",
  phone: "",
  picture: "",
  role: "CLIENT",
});

export function useAuthState() {
  const isLoading = useState("auth-loading", () => false);
  const error = useState<{ message: string; field?: string } | null>(
    "auth-error",
    () => null,
  );
  const user = useState<AuthUser>("auth-user", createEmptyUser);
  const isAuthenticated = useState("auth-is-authenticated", () => false);

  const syncFromStorage = () => {
    if (!import.meta.client) {
      return false;
    }

    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      user.value = createEmptyUser();
      isAuthenticated.value = false;
      return false;
    }

    try {
      user.value = JSON.parse(storedUser);
      isAuthenticated.value = true;
      return true;
    } catch {
      user.value = createEmptyUser();
      isAuthenticated.value = false;
      return false;
    }
  };

  const setAuthData = (data: AuthResponse) => {
    if (data.access_token) {
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      user.value = data.user;
      isAuthenticated.value = true;
    }
  };

  const clearAuthData = () => {
    if (import.meta.client) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    user.value = createEmptyUser();
    isAuthenticated.value = false;
  };

  return {
    isLoading,
    error,
    user,
    isAuthenticated,
    syncFromStorage,
    setAuthData,
    clearAuthData,
  };
}
