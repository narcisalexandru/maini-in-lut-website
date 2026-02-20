export default defineNuxtPlugin(async () => {
  const { loadCart } = useCart();
  await loadCart();
});
