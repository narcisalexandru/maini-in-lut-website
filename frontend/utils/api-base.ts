export function getApiBaseUrl(): string {
  const config = useRuntimeConfig();
  return String(config.public.apiBase || "").replace(/\/$/, "");
}
