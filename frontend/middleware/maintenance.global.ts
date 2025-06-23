export default defineNuxtRouteMiddleware((to) => {
  if (to.path !== "/maintenance") {
    return navigateTo("/maintenance");
  }
});
