import type { AuthUser } from "~/types/user";
import { apiRequest } from "~/utils/api-request";

export async function syncStoredUserProfile(): Promise<AuthUser | null> {
  if (!import.meta.client) {
    return null;
  }

  const { setAuthData, clearAuthData, user, isAuthenticated } = useAuthState();
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  try {
    const response = await apiRequest("/users/profile");

    if (response.status === 401) {
      void apiRequest("/auth/logout", {
        method: "POST",
        signal: AbortSignal.timeout(5000),
      }).catch(() => undefined);
      clearAuthData();
      return null;
    }

    if (!response.ok) {
      return isAuthenticated.value ? user.value : null;
    }

    const profile = (await response.json()) as AuthUser;
    setAuthData(profile);
    return profile;
  } catch {
    return isAuthenticated.value ? user.value : null;
  }
}
