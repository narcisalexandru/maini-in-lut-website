export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) {
    return;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    const localePrefix = to.path.startsWith("/en") ? "/en" : "";
    return navigateTo(`${localePrefix}/login?redirect=${encodeURIComponent(to.fullPath)}`);
  }
});
