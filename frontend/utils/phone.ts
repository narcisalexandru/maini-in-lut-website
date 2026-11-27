const ROMANIAN_PHONE_PATTERN = /^0[0-9]{9}$/;

export function normalizeRomanianPhone(input: string): string | null {
  const digits = String(input ?? "").replace(/\D/g, "");
  if (!digits) {
    return null;
  }

  let normalized: string;
  if (digits.length === 11 && digits.startsWith("40")) {
    normalized = `0${digits.slice(2)}`;
  } else if (digits.length === 10) {
    normalized = digits;
  } else {
    return null;
  }

  return ROMANIAN_PHONE_PATTERN.test(normalized) ? normalized : null;
}

export function isRomanianPhone(input: string): boolean {
  return normalizeRomanianPhone(input) !== null;
}
