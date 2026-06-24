export function getApiBaseUrl(): string {
  const config = useRuntimeConfig();
  return (
    config.public.apiBase ||
    import.meta.env.VITE_BACKEND_URL ||
    "http://localhost:4000"
  );
}

export function resolveProductImageUrl(src: string | null | undefined): string {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }
  if (src.startsWith("/uploads/")) {
    return `${getApiBaseUrl()}${src}`;
  }
  return src;
}
