import { getApiBaseUrl } from "~/utils/api-base";

export function apiRequest(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("X-Requested-With", "maini");
  if (
    init.body &&
    !(init.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = import.meta.client
    ? `/api${normalizedPath}`
    : `${getApiBaseUrl()}${normalizedPath}`;
  return fetch(url, {
    ...init,
    headers,
    credentials: "include",
  });
}
