export default defineNuxtPlugin(() => {
  const { loadFavorites } = useFavorites();
  loadFavorites();
});
