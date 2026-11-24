import type { AuthUser } from "~/types/user";

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

  const syncFromStorage = () => isAuthenticated.value && user.value.id > 0;

  const setAuthData = (nextUser: AuthUser) => {
    user.value = nextUser;
    isAuthenticated.value = true;
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
