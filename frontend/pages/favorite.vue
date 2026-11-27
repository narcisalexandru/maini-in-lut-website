<template>
  <div class="maini-ui__section md:px-4">
    <div class="maini-ui__container-products">
      <header class="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold h-color-lunar-green md:text-3xl">
            {{ t("title") }}
          </h1>
          <p class="mt-2 max-w-xl text-sm text-gray-600">{{ t("subtitle") }}</p>
        </div>
        <NuxtLink
          :to="$localePath('/produse')"
          class="inline-flex items-center gap-2 text-sm font-semibold uppercase h-color-primary hover:underline"
        >
          {{ t("browseCatalog") }}
          <i class="ph ph-arrow-right" aria-hidden="true"></i>
        </NuxtLink>
      </header>

      <div
        v-if="loading"
        class="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6"
        aria-busy="true"
        :aria-label="t('loading')"
      >
        <div
          v-for="placeholder in 4"
          :key="placeholder"
          class="aspect-[3/4] animate-pulse rounded-lg bg-white/80"
        />
      </div>

      <template v-else>
        <section v-if="favoriteProducts.length > 0" :aria-label="t('title')">
          <p class="mb-4 text-sm text-gray-600">{{ favoriteCountLabel }}</p>
          <div class="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
            <ProductCard
              v-for="product in favoriteProducts"
              :key="product.id"
              :product="product"
            />
          </div>
        </section>

        <section
          v-else
          class="rounded-2xl border border-[#d7e0d2] bg-white px-6 py-10 text-center md:px-10 md:py-12"
        >
          <div
            class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#e7efe2] text-[#3f5134]"
          >
            <i class="ph ph-heart text-3xl" aria-hidden="true"></i>
          </div>
          <h2 class="mb-2 text-xl font-bold h-color-lunar-green md:text-2xl">
            {{ t("emptyTitle") }}
          </h2>
          <p class="mx-auto max-w-md text-gray-600">{{ t("empty") }}</p>
          <NuxtLink
            :to="$localePath('/produse')"
            class="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#6f825d] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#5d6e4e]"
          >
            <i class="ph ph-storefront text-base" aria-hidden="true"></i>
            {{ t("browseCatalog") }}
          </NuxtLink>
        </section>

        <section v-if="recommendedProducts.length > 0" class="mt-14">
          <div class="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 class="mb-1 text-2xl font-bold h-color-lunar-green">
                {{ t("recommendedTitle") }}
              </h2>
              <p class="text-sm text-gray-600">{{ recommendedSubtitle }}</p>
            </div>
            <NuxtLink
              :to="$localePath('/produse')"
              class="text-sm font-semibold uppercase h-color-primary hover:underline"
            >
              {{ t("viewAllCollection") }}
            </NuxtLink>
          </div>
          <div class="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
            <ProductCard
              v-for="product in recommendedProducts"
              :key="product.id"
              :product="product"
            />
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup>
import { apiRequest } from "~/utils/api-request";
import { isProductAvailable, sortInStockFirst } from "~/utils/product-stock";

defineI18nRoute({
  paths: {
    ro: "/favorite",
    en: "/favourite",
  },
});

const { t } = useI18n({
  useScope: "local",
});

useSeoMeta({
  title: () => t("title"),
  description: () => t("subtitle"),
});

const { favoriteIds, loadFavorites } = useFavorites();
const products = ref([]);
const loading = ref(true);

const favoriteProducts = computed(() => {
  const ids = favoriteIds.value;
  return sortInStockFirst(products.value.filter((product) => ids.includes(product.id)));
});

const favoriteCountLabel = computed(() => {
  const count = favoriteProducts.value.length;
  return count === 1 ? t("countOne") : t("countMany", { count });
});

const recommendedProducts = computed(() => {
  const savedIds = new Set(favoriteIds.value);
  const savedCategories = new Set(
    favoriteProducts.value
      .map((product) => product.category)
      .filter((category) => Boolean(category)),
  );

  return [...products.value]
    .filter((product) => !savedIds.has(product.id))
    .sort((left, right) => {
      const stockRank =
        Number(!isProductAvailable(left)) - Number(!isProductAvailable(right));
      if (stockRank !== 0) return stockRank;

      const categoryRank =
        Number(!savedCategories.has(left.category)) -
        Number(!savedCategories.has(right.category));
      if (categoryRank !== 0) return categoryRank;

      return Number(right.popularity || 0) - Number(left.popularity || 0);
    })
    .slice(0, 4);
});

const recommendedSubtitle = computed(() =>
  favoriteProducts.value.length > 0
    ? t("recommendedFromFavorites")
    : t("recommendedSubtitle"),
);

onMounted(async () => {
  try {
    await loadFavorites();
    const response = await apiRequest("/products");
    if (!response.ok) return;
    const data = await response.json();
    products.value = Array.isArray(data) ? data : [];
  } catch {
    products.value = [];
  } finally {
    loading.value = false;
  }
});
</script>

<i18n lang="json">
{
  "en": {
    "title": "My favorites",
    "subtitle": "Pieces you set aside, so you can come back to them anytime.",
    "browseCatalog": "Browse the catalog",
    "loading": "Loading favorites",
    "countOne": "1 saved product",
    "countMany": "{count} saved products",
    "emptyTitle": "Nothing saved yet",
    "empty": "Tap the heart on a piece you like. It will stay here until you are ready to order.",
    "recommendedTitle": "You might also like",
    "recommendedSubtitle": "A few pieces from the workshop, chosen to get you started.",
    "recommendedFromFavorites": "Other pieces close to the ones you already saved.",
    "viewAllCollection": "View full collection"
  },
  "ro": {
    "title": "Favoritele mele",
    "subtitle": "Piesele pe care le-ai pus deoparte, ca să le găsești ușor.",
    "browseCatalog": "Vezi catalogul",
    "loading": "Se încarcă favoritele",
    "countOne": "1 produs salvat",
    "countMany": "{count} produse salvate",
    "emptyTitle": "Încă nu ai favorite",
    "empty": "Apasă inima de pe o piesă care îți place. Rămâne aici până când ești gata să o comanzi.",
    "recommendedTitle": "S-ar putea să-ți placă",
    "recommendedSubtitle": "Câteva piese din atelier, ca să începi de undeva.",
    "recommendedFromFavorites": "Alte piese apropiate de cele pe care le-ai salvat deja.",
    "viewAllCollection": "Vezi toată colecția"
  }
}
</i18n>
