type ApiErrorBody = {
  message?: string | string[] | { message?: string };
};

function extractApiErrorMessage(
  data: ApiErrorBody | null | undefined,
): string {
  if (!data?.message) {
    return "";
  }
  if (Array.isArray(data.message)) {
    return data.message.join(", ");
  }
  if (typeof data.message === "string") {
    return data.message;
  }
  if (
    typeof data.message === "object" &&
    typeof data.message.message === "string"
  ) {
    return data.message.message;
  }
  return "";
}

type ApiFetchOptions = RequestInit & {
  auth?: boolean;
};

export function useApi() {
  const config = useRuntimeConfig();

  const getBaseUrl = () =>
    config.public.apiBase ||
    import.meta.env.VITE_BACKEND_URL ||
    "http://localhost:4000";

  const getToken = () => {
    if (!import.meta.client) {
      return null;
    }
    return localStorage.getItem("token");
  };

  const apiFetch = async <T>(
    path: string,
    options: ApiFetchOptions = {},
  ): Promise<T> => {
    const { auth = true, ...fetchOptions } = options;
    const headers = new Headers(fetchOptions.headers);

    if (
      fetchOptions.body &&
      !(fetchOptions.body instanceof FormData) &&
      !headers.has("Content-Type")
    ) {
      headers.set("Content-Type", "application/json");
    }

    if (auth) {
      const token = getToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }

    const response = await fetch(`${getBaseUrl()}${path}`, {
      ...fetchOptions,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        extractApiErrorMessage(data) || "Request failed";
      throw new Error(message);
    }

    return data as T;
  };

  return {
    apiFetch,
    getBaseUrl,
    getToken,
  };
}
