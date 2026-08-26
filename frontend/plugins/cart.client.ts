export default defineNuxtPlugin(async () => {
  const { loadCart, refreshGuestReservations } = useCart();
  await loadCart();

  if (import.meta.client) {
    window.setInterval(() => {
      void refreshGuestReservations();
    }, 5 * 60 * 1000);
  }
});
