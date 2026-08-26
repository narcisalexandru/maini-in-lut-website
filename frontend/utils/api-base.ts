export function getApiBaseUrl(): string {
  const config = useRuntimeConfig();
  return (
    config.public.apiBase ||
    import.meta.env.VITE_BACKEND_URL ||
    "http://localhost:4000"
  );
}
