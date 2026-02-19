<template>
  <div class="maini-ui__section md:px-4">
    <div class="maini-ui__container-products">
      <h2 class="text-2xl font-bold mb-6">{{ t("title") }}</h2>
      <div v-if="favoriteProducts.length > 0" class="grid grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-6">
        <ProductCard
          v-for="product in favoriteProducts"
          :key="product.id"
          :product="product"
        />
      </div>
      <div v-else class="text-center py-12 h-color-lunar-green">
        <i class="ph ph-heart text-6xl mb-4 opacity-50"></i>
        <p class="text-lg">{{ t("empty") }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
defineI18nRoute({
  paths: {
    ro: "/favorite",
    en: "/favourite",
  },
});

const { t } = useI18n({
  useScope: "local",
});

const { favoriteIds, loadFavorites } = useFavorites();
const products = ref([]);

const favoriteProducts = computed(() => {
  const ids = favoriteIds.value;
  return products.value.filter((p) => ids.includes(p.id));
});

onMounted(async () => {
  await loadFavorites();
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/products`
    );
    const data = await response.json();
    products.value = data;
  } catch (error) {
    console.error("Error fetching products:", error);
  }
});
</script>

<i18n lang="json">
{
  "en": {
    "title": "My Favorites",
    "empty": "You have no favorites yet. Add products from the catalog!"
  },
  "ro": {
    "title": "Favoritele mele",
    "empty": "Nu ai încă produse favorite. Adaugă produse din catalog!"
  }
}
</i18n>
