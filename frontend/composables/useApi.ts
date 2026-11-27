import { apiRequest } from "~/utils/api-request";
import { getApiBaseUrl } from "~/utils/api-base";

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
  const getBaseUrl = () => getApiBaseUrl();

  const getToken = () => {
    if (!import.meta.client) {
      return null;
    }
    return useAuthState().isAuthenticated.value ? "cookie" : null;
  };

  const apiFetch = async <T>(
    path: string,
    options: ApiFetchOptions = {},
  ): Promise<T> => {
    const { auth: _auth = true, ...fetchOptions } = options;
    const response = await apiRequest(path, fetchOptions);

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
