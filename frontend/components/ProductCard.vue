<template>
  <div
    class="bg-white flex flex-col flex-1 shrink rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 relative"
  >
    <NuxtLink
      :to="$localePath(`/produs/${product.id}`)"
      class="block relative h-48"
    >
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
      <button
        type="button"
        class="absolute bottom-2 right-2 h-font-size-20 flex items-center justify-center transition-all duration-300 w-10 h-10 h-bg-white rounded-full group hover:scale-110"
        :aria-label="
          isFavorite(product.id) ? 'Elimină din favorite' : 'Adaugă în favorite'
        "
        @click.prevent="toggleFavorite(product.id)"
      >
        <i
          v-show="!isFavorite(product.id)"
          class="ph ph-heart transition-all duration-300 group-hover:hidden h-color-primary"
        ></i>
        <i
          :class="[
            'ph ph-heart ph-fill transition-all duration-300 h-color-primary',
            isFavorite(product.id) ? 'block' : 'hidden group-hover:block',
          ]"
        ></i>
      </button>
    </NuxtLink>
    <NuxtLink
      :to="$localePath(`/produs/${product.id}`)"
      class="flex flex-col h-36 p-2 md:p-3 flex-1 hover:opacity-90 transition-opacity no-underline text-inherit"
    >
      <h3 class="flex flex-1 text-sm font-semibold text-gray-800 mb-1">
        {{ product.title }}
      </h3>
      <div class="flex items-center space-x-2 mb-1">
        <span
          v-if="product.discount > 0"
          class="text-gray-400 line-through text-xs"
          >{{ product.priceBeforeDiscount }} RON</span
        >
        <span class="flex h-font-weight-600 h-color-lunar-green h-font-size-16"
          >{{ product.price }} RON</span
        >
      </div>
      <div class="flex w-full">
        <button
          type="button"
          class="maini-ui-button__buy w-full flex justify-center items-center border-none cursor-pointer"
          aria-label="Adaugă în coș"
          @click.prevent.stop="addToCart(product.id)"
        >
          Adaugă în coș
        </button>
      </div>
    </NuxtLink>
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

const { toggleFavorite, isFavorite } = useFavorites();
const { addToCart } = useCart();

const isNew = computed(() => {
  const now = new Date();
  const published = new Date(product.datePublished);
  const diffDays = (now - published) / (1000 * 60 * 60 * 24);
  // return diffDays <= 7;
});
</script>
