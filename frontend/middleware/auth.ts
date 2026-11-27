export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) {
    return;
  }

  const user = await syncStoredUserProfile();
  if (!user) {
    const localePrefix = to.path.startsWith("/en") ? "/en" : "";
    return navigateTo(
      `${localePrefix}/login?redirect=${encodeURIComponent(to.fullPath)}`,
    );
  }
});
