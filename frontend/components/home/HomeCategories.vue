<template>
  <section class="home-categories" aria-labelledby="home-categories-title">
    <div class="maini-ui__container">
      <h2 id="home-categories-title" class="home-categories__title">
        {{ t("title") }}
      </h2>
      <ul
        class="home-categories__list"
        :class="{ 'home-categories__list--single': categories.length === 1 }"
      >
        <li v-for="category in categories" :key="category.name">
          <NuxtLink
            class="home-categories__card"
            :to="categoryLink(category.name)"
          >
            <span class="home-categories__media">
              <img
                :src="category.image"
                :alt="category.name"
                width="640"
                height="640"
                loading="lazy"
                decoding="async"
              />
            </span>
            <span class="home-categories__body">
              <span class="home-categories__name">{{ category.name }}</span>
              <span class="home-categories__count">
                {{
                  category.count === 1
                    ? t("countOne")
                    : t("countMany", { count: category.count })
                }}
              </span>
            </span>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { HomeCategoryCard } from "./types";

defineProps<{
  categories: HomeCategoryCard[];
}>();

const { t } = useI18n({ useScope: "local" });
const localePath = useLocalePath();

function categoryLink(name: string) {
  return localePath({
    path: "/produse",
    query: { categorie: name },
  });
}
</script>

<i18n lang="json">
{
  "ro": {
    "title": "Categorii",
    "countOne": "1 piesă",
    "countMany": "{count} piese"
  },
  "en": {
    "title": "Categories",
    "countOne": "1 piece",
    "countMany": "{count} pieces"
  }
}
</i18n>

<style scoped lang="scss">
@use "./home" as *;
@use "../../assets/scss/functions" as *;

.home-categories {
  padding: rem(28px) 0;
  background: $home-white;

  @media (min-width: 768px) {
    padding: rem(48px) 0;
  }
}

.home-categories__title {
  @include home-title;
  margin-bottom: rem(18px);
}

.home-categories__list {
  display: grid;
  gap: rem(16px);
  margin: 0;
  padding: 0;
  list-style: none;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (min-width: 992px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.home-categories__list--single {
  @media (min-width: 768px) {
    grid-template-columns: minmax(0, 1fr);
  }
}

.home-categories__card {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border-radius: rem(8px);
  background: $home-cream;
  color: inherit;
  text-decoration: none;
}

.home-categories__list--single .home-categories__card {
  @media (min-width: 768px) {
    flex-direction: row;
    align-items: stretch;
    min-height: rem(280px);
  }
}

.home-categories__media {
  display: block;
  overflow: hidden;
  background: $home-line;
  aspect-ratio: 1;

  @media (min-width: 768px) {
    .home-categories__list--single & {
      flex: 0 0 46%;
      aspect-ratio: auto;
    }
  }
}

.home-categories__media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s ease;
}

.home-categories__card:hover img {
  transform: scale(1.03);
}

.home-categories__card:focus-visible {
  outline: 2px solid $home-heading;
  outline-offset: 3px;
}

.home-categories__body {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: rem(4px);
  padding: rem(14px) rem(16px) rem(16px);
}

.home-categories__name {
  color: $home-heading;
  font-size: rem(20px);
  font-weight: 700;
  line-height: 1.3;
}

.home-categories__count {
  color: $home-ink;
  font-size: rem(14px);
}

@media (prefers-reduced-motion: reduce) {
  .home-categories__media img {
    transition: none;
  }

  .home-categories__card:hover img {
    transform: none;
  }
}
</style>
