import type { AuthUser } from "~/types/user";

export async function syncStoredUserProfile(): Promise<AuthUser | null> {
  if (!import.meta.client) {
    return null;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    return null;
  }

  const config = useRuntimeConfig();
  const baseUrl =
    config.public.apiBase || import.meta.env.VITE_BACKEND_URL || "";

  try {
    const response = await fetch(`${baseUrl}/users/profile`, {
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
