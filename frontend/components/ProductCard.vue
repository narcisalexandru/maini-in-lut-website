<template>
  <div
    class="bg-white flex flex-col flex-1 shrink rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 relative"
  >
    <div class="relative h-48">
      <img
        :src="product.image"
        :alt="product.title"
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
        Nou
      </span>
      <span
        v-if="product.popularity > 100"
        class="absolute top-2 right-2 bg-yellow-400 text-white text-xs font-bold px-2 py-1 rounded shadow"
      >
        Popular
      </span>
    </div>
    <div class="flex flex-1 flex-col shrink p-2">
      <h3 class="flex flex-1 text-sm font-semibold text-gray-800 mb-2">
        {{ product.title }}
      </h3>
      <div class="flex items-center space-x-2 mb-1">
        <span
          v-if="product.discount > 0"
          class="text-gray-400 line-through text-xs"
          >{{ product.priceBeforeDiscount }} RON</span
        >
        <span class="flex text-sm font-bold text-primary-600"
          >{{ product.price }} RON</span
        >
      </div>
      <div class="flex w-full items-center justify-center">
        <Button
          class="maini-ui-button__heart transition-all duration-300 w-1/4 sm:w-1/5 md:w-1/6 h-bg-transparent border-none group"
        >
          <i
            class="ph ph-heart transition-all duration-300 group-hover:hidden h-color-primary"
          ></i>
          <i
            class="ph ph-fill transition-all duration-300 ph-heart hidden group-hover:block h-color-primary"
          ></i>
        </Button>
        <Button
          class="maini-ui-button__buy w-full flex justify-center items-center h-bg-primary h-color-white border-none"
        >
          Adaugă în coș
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const { product } = defineProps({
  product: {
    type: Object,
    required: true,
  },
});

const isNew = computed(() => {
  const now = new Date();
  const published = new Date(product.datePublished);
  const diffDays = (now - published) / (1000 * 60 * 60 * 24);
  return diffDays <= 7;
});
</script>
