export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) {
    return;
  }

  const localePrefix = to.path.startsWith("/en") ? "/en" : "";

  const token = localStorage.getItem("token");
  if (!token) {
    return navigateTo(
      `${localePrefix}/login?redirect=${encodeURIComponent(to.fullPath)}`,
    );
  }

  const user = await syncStoredUserProfile();
  if (!user) {
    return navigateTo(
      `${localePrefix}/login?redirect=${encodeURIComponent(to.fullPath)}`,
    );
  }

  if (user.role !== "ARTIST" && user.role !== "SUPER_ADMIN") {
    return navigateTo(localePrefix || "/");
  }
});
