<template>
  <div
    class="bg-white flex flex-col flex-1 shrink rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 relative"
  >
    <div class="relative h-48">
      <img
        :src="product.image"
        :alt="productTitle"
        class="w-full h-full object-cover"
      />
      <span
        v-if="product.discount > 0"
        class="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow"
      >
        -{{ product.discount }}%
      </span>
      <span
        v-if="isNew"
        class="absolute top-2 left-2 ml-20 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded shadow"
      >
        {{ t("new") }}
      </span>
      <span
        v-if="product.popularity > 100"
        class="absolute top-2 right-2 bg-yellow-400 text-white text-xs font-bold px-2 py-1 rounded shadow"
      >
        {{ t("popular") }}
      </span>
      <button
        class="absolute bottom-2 right-2 h-font-size-20 flex items-center justify-center transition-all duration-300 w-10 h-10 h-bg-white rounded-full group hover:scale-110"
      >
        <i
          class="ph ph-heart transition-all duration-300 group-hover:hidden h-color-primary"
        ></i>
        <i
          class="ph ph-fill transition-all duration-300 ph-heart hidden group-hover:block h-color-primary"
        ></i>
      </button>
    </div>
    <div class="flex flex-col h-36 p-2 md:p-3">
      <h3 class="flex flex-1 text-sm font-semibold text-gray-800 mb-1">
        {{ productTitle }}
      </h3>
      <div class="flex items-center space-x-2 mb-1">
        <span
          v-if="
            product.discount > 0 &&
            typeof product.priceBeforeDiscount === 'number' &&
            !isNaN(product.priceBeforeDiscount)
          "
          class="text-gray-400 line-through text-xs"
        >
          {{ formatPrice(product.priceBeforeDiscount) }}
        </span>
        <span
          class="flex h-font-weight-600 h-color-lunar-green h-font-size-16"
          >{{ formatPrice(product.price) }}</span
        >
      </div>
      <div class="flex w-full">
        <Button
          class="maini-ui-button__buy w-full flex justify-center items-center border-none"
        >
          {{ t("addToCart") }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const { product } = defineProps({
  product: {
    type: Object,
    required: true,
  },
});

const { t, locale } = useI18n({ useScope: "local" });
const EUR_RATE = 5;

function formatPrice(price) {
  if (typeof price !== "number" || isNaN(price)) return "";
  if (locale.value === "en") {
    return `${(price / EUR_RATE).toFixed(2)} €`;
  } else {
    return `${price} lei`;
  }
}

const isNew = computed(() => {
  const now = new Date();
  const published = new Date(product.datePublished);
  const diffDays = (now - published) / (1000 * 60 * 60 * 24);
  return diffDays <= 7;
});

const productTitle = computed(() => {
  let title = product.title;
  const lang = locale.value || "ro";
  if (!title) return "";
  if (typeof title === "string") {
    try {
      const parsed = JSON.parse(title);
      if (typeof parsed === "object" && parsed !== null) {
        title = parsed;
      } else {
        return title;
      }
    } catch {
      return title;
    }
  }
  if (typeof title === "object" && title !== null) {
    return title[lang] || title["ro"] || Object.values(title)[0] || "";
  }
  return "";
});
</script>

<i18n lang="json">
{
  "en": {
    "addToCart": "Add to cart",
    "popular": "Popular",
    "new": "New"
  },
  "ro": {
    "addToCart": "Adaugă în coș",
    "popular": "Popular",
    "new": "Nou"
  }
}
</i18n>
