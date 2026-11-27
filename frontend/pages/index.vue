<template>
  <div class="home-page">
    <HomeHero />
    <HomeAdvantages />
    <HomeCategories v-if="categories.length" :categories="categories" />
    <HomeFeatured v-if="featuredProducts.length" :products="featuredProducts" />
    <HomeStory :image-src="storyImage.src" :image-alt="storyImage.alt" />
    <HomeProcess />
    <HomeWorkshops :workshops="upcomingWorkshops" />
    <HomeSocial />
  </div>
</template>

<script setup lang="ts">
import type { PublicProduct } from "~/types/product";
import type { PublicWorkshop } from "~/types/workshop";
import type { HomeCategoryCard } from "~/components/home/types";
import { getProductPrimaryImageUrl } from "~/utils/product-image";
import { getApiBaseUrl } from "~/utils/api-base";
import { isProductAvailable, sortInStockFirst } from "~/utils/product-stock";
import { COMPANY } from "~/constants/company";
import HomeHero from "~/components/home/HomeHero.vue";
import HomeAdvantages from "~/components/home/HomeAdvantages.vue";
import HomeCategories from "~/components/home/HomeCategories.vue";
import HomeFeatured from "~/components/home/HomeFeatured.vue";
import HomeStory from "~/components/home/HomeStory.vue";
import HomeProcess from "~/components/home/HomeProcess.vue";
import HomeWorkshops from "~/components/home/HomeWorkshops.vue";
import HomeSocial from "~/components/home/HomeSocial.vue";

const FEATURED_LIMIT = 8;

const { t } = useI18n({ useScope: "local" });
const localePath = useLocalePath();
const requestUrl = useRequestURL();
const apiBase = getApiBaseUrl();

useSeoMeta({
  description: () => t("metaDescription"),
  ogTitle: () => t("metaTitle"),
  ogDescription: () => t("metaDescription"),
});

useHead({
  title: () => t("metaTitle"),
});

const { data: products } = await useAsyncData<PublicProduct[]>(
  "home-products",
  async () => {
    try {
      const response = await $fetch<PublicProduct[]>(`${apiBase}/products`, {
        headers: { "X-Requested-With": "maini" },
      });
      return Array.isArray(response) ? response : [];
    } catch {
      return [];
    }
  },
  { default: () => [] },
);

const { data: workshops } = await useAsyncData<PublicWorkshop[]>(
  "home-workshops",
  async () => {
    try {
      const response = await $fetch<PublicWorkshop[]>(`${apiBase}/workshops`, {
        headers: { "X-Requested-With": "maini" },
      });
      return Array.isArray(response) ? response : [];
    } catch {
      return [];
    }
  },
  { default: () => [] },
);

const upcomingWorkshops = computed(() =>
  [...(workshops.value ?? [])]
    .sort((left, right) => Date.parse(left.startsAt) - Date.parse(right.startsAt))
    .slice(0, 2),
);

const featuredProducts = computed(() => {
  const ranked = [...(products.value ?? [])].sort((left, right) => {
    const byPopularity = (right.popularity ?? 0) - (left.popularity ?? 0);
    if (byPopularity !== 0) {
      return byPopularity;
    }
    const leftDate = left.datePublished ? Date.parse(left.datePublished) : 0;
    const rightDate = right.datePublished ? Date.parse(right.datePublished) : 0;
    return rightDate - leftDate;
  });
  return sortInStockFirst(ranked).slice(0, FEATURED_LIMIT);
});

const categories = computed<HomeCategoryCard[]>(() => {
  const grouped = new Map<string, HomeCategoryCard>();
  for (const product of products.value ?? []) {
    const name = product.category?.trim();
    if (!name) {
      continue;
    }
    const current = grouped.get(name);
    const image = getProductPrimaryImageUrl(product);
    if (!current) {
      grouped.set(name, { name, image, count: 1 });
      continue;
    }
    current.count += 1;
    if (!current.image && image) {
      current.image = image;
    }
  }
  return [...grouped.values()];
});

const storyImage = computed(() => {
  const available = (products.value ?? []).filter((item) =>
    isProductAvailable(item),
  );
  const product = available.at(-1) ?? products.value?.[0];
  if (!product) {
    return { src: "", alt: "" };
  }
  return {
    src: getProductPrimaryImageUrl(product),
    alt: product.title,
  };
});

const structuredData = computed(() => {
  const origin = requestUrl.origin;
  const itemList = featuredProducts.value.map((product, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: `${origin}${localePath(`/produs/${product.id}`)}`,
    name: product.title,
  }));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: COMPANY.brandName,
        legalName: COMPANY.legalName,
        email: COMPANY.email,
        telephone: COMPANY.phoneTel,
        url: origin,
      },
      {
        "@type": "ItemList",
        name: t("metaTitle"),
        itemListElement: itemList,
      },
    ],
  };
});

useHead({
  script: computed(() => [
    {
      key: "home-jsonld",
      type: "application/ld+json",
      innerHTML: JSON.stringify(structuredData.value),
    },
  ]),
});
</script>

<i18n lang="json">
{
  "ro": {
    "metaTitle": "Mâini în lut · Ceramică lucrată manual",
    "metaDescription": "Ceramică lucrată manual în Sibiu. Descoperă piese create cu răbdare, din lut, pentru ritualurile de zi cu zi."
  },
  "en": {
    "metaTitle": "Mâini în lut · Handmade ceramics",
    "metaDescription": "Handmade ceramics from Sibiu. Discover pieces shaped with patience, from clay, for everyday rituals."
  }
}
</i18n>

<style scoped>
.home-page {
  overflow-x: hidden;
}
</style>
