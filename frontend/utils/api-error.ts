type ApiErrorBody = {
  message?: string | string[] | { message?: string };
};

export function extractApiErrorMessage(
  err: ApiErrorBody | null | undefined,
): string {
  if (!err?.message) {
    return "";
  }
  if (Array.isArray(err.message)) {
    return err.message.join(" ");
  }
  if (typeof err.message === "string") {
    return err.message;
  }
  if (
    typeof err.message === "object" &&
    typeof err.message.message === "string"
  ) {
    return err.message.message;
  }
  return "";
}

const PHONE_API_ERROR_KEYS: Record<string, string> = {
  "Phone number must be exactly 10 digits": "phoneInvalidFormat",
  "Phone number is already in use by another user": "phoneAlreadyInUse",
};

export function formatPhoneApiError(
  err: ApiErrorBody | null | undefined,
  t: (key: string) => string,
  messageMap: Record<string, string> = PHONE_API_ERROR_KEYS,
): string {
  const raw = extractApiErrorMessage(err);
  if (!raw) {
    return "";
  }
  const key = messageMap[raw];
  if (key) {
    return t(key);
  }
  return raw;
}

export function formatApiError(
  err: ApiErrorBody | null | undefined,
  messageMap?: Record<string, string>,
  t?: (key: string) => string,
): string {
  const raw = extractApiErrorMessage(err);
  if (!raw) {
    return "";
  }
  if (messageMap && t) {
    const key = messageMap[raw];
    if (key) {
      return t(key);
    }
  }
  return raw;
}
