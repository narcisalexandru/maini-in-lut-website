export default defineNuxtPlugin(async () => {
  const { loadFavorites } = useFavorites();
  await loadFavorites();
});
