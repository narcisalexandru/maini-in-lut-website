<template>
  <section class="home-featured" aria-labelledby="home-featured-title">
    <div class="maini-ui__container">
      <div class="home-featured__head">
        <div>
          <h2 id="home-featured-title" class="home-featured__title">
            {{ t("title") }}
          </h2>
          <p class="home-featured__lead">{{ t("lead") }}</p>
        </div>
        <NuxtLink :to="$localePath('/produse')" class="home-featured__cta">
          {{ t("viewAll") }}
        </NuxtLink>
      </div>
      <div class="home-featured__grid">
        <ProductCard
          v-for="product in products"
          :key="product.id"
          :product="product"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import ProductCard from "~/components/ProductCard.vue";
import type { PublicProduct } from "~/types/product";

defineProps<{
  products: PublicProduct[];
}>();

const { t } = useI18n({ useScope: "local" });
</script>

<i18n lang="json">
{
  "ro": {
    "title": "Piese din atelier",
    "lead": "O selecție din piesele disponibile acum. Prețul și stocul sunt cele din magazin.",
    "viewAll": "Vezi toate produsele"
  },
  "en": {
    "title": "Pieces from the studio",
    "lead": "A selection of pieces available now. Price and stock come from the shop.",
    "viewAll": "View all products"
  }
}
</i18n>

<style scoped lang="scss">
@use "./home" as *;
@use "../../assets/scss/functions" as *;

.home-featured {
  padding: rem(36px) 0;

  @media (min-width: 768px) {
    padding: rem(56px) 0;
  }
}

.home-featured__head {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: rem(16px);
  margin-bottom: rem(20px);

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }
}

.home-featured__title {
  @include home-title;
}

.home-featured__lead {
  @include home-lead;
}

.home-featured__cta {
  @include home-cta-primary;
  flex-shrink: 0;
}

.home-featured__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: rem(12px);

  @media (min-width: 992px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: rem(20px);
  }
}
</style>
