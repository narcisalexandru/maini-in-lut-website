import type { AuthUser } from "~/types/user";
import { getApiBaseUrl } from "~/utils/api-base";

export async function syncStoredUserProfile(): Promise<AuthUser | null> {
  if (!import.meta.client) {
    return null;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/users/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      return null;
    }

    const user = (await response.json()) as AuthUser;
    localStorage.setItem("user", JSON.stringify(user));
    return user;
  } catch {
    return null;
  }
}
