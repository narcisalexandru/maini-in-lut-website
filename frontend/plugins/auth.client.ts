export default defineNuxtPlugin(() => {
  const { syncFromStorage } = useAuthState();
  syncFromStorage();
});
