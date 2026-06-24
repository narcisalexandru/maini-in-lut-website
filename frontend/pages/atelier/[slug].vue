<template>
  <div class="maini-ui__section md:px-4">
    <div class="maini-ui__container-products">
      <div v-if="loading" class="flex justify-center py-16">
        <i class="ph ph-spinner text-4xl animate-spin h-color-primary"></i>
      </div>

      <div v-else-if="artist">
        <h1 class="text-3xl font-bold h-color-lunar-green mb-4">
          {{ artist.displayName }}
        </h1>
        <p class="text-gray-600 mb-8 max-w-2xl">{{ artist.description }}</p>
        <a
          v-if="artist.portfolioUrl"
          :href="artist.portfolioUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="text-sm h-color-primary underline mb-8 inline-block"
        >
          {{ t("portfolio") }}
        </a>

        <h2 class="text-xl font-semibold h-color-lunar-green mb-4">
          {{ t("products") }}
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <ProductCard
            v-for="product in artistProducts"
            :key="product.id"
            :product="product"
          />
        </div>
        <p v-if="!artistProducts.length" class="h-color-lunar-green">
          {{ t("noProducts") }}
        </p>
      </div>

      <div v-else class="text-center py-16 h-color-lunar-green">
        {{ t("notFound") }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ProductCard from "~/components/ProductCard.vue";
import type { PublicProduct } from "~/types/product";

defineI18nRoute({
  paths: {
    ro: "/atelier/[slug]",
    en: "/studio/[slug]",
  },
});

const route = useRoute();
const { t } = useI18n({ useScope: "local" });
const { getPublicProfile } = useArtist();
const { getBaseUrl } = useApi();

const slug = computed(() => String(route.params.slug || ""));
const artist = ref(null);
const artistProducts = ref<PublicProduct[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    artist.value = await getPublicProfile(slug.value);
    const res = await fetch(`${getBaseUrl()}/products`);
    const products = (await res.json()) as PublicProduct[];
    artistProducts.value = products.filter(
      (product) => product.artist?.slug === slug.value,
    );
  } catch {
    artist.value = null;
  } finally {
    loading.value = false;
  }
});
</script>

<i18n lang="json">
{
  "ro": {
    "portfolio": "Vezi portfolio",
    "products": "Produse",
    "noProducts": "Nu există produse publicate momentan.",
    "notFound": "Atelierul nu a fost găsit."
  },
  "en": {
    "portfolio": "View portfolio",
    "products": "Products",
    "noProducts": "No published products yet.",
    "notFound": "Studio not found."
  }
}
</i18n>
