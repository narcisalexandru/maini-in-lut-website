<template>
  <section class="home-workshops" aria-labelledby="home-workshops-title">
    <div class="maini-ui__container home-workshops__inner">
      <p class="home-workshops__kicker">{{ t("kicker") }}</p>
      <h2 id="home-workshops-title">{{ t("title") }}</h2>
      <p>{{ t("lead") }}</p>
      <ul v-if="workshops.length" class="home-workshops__list">
        <li v-for="workshop in workshops" :key="workshop.id">
          <NuxtLink :to="workshopLink(workshop.slug)" class="home-workshops__item">
            <span class="home-workshops__when">{{ formatWhen(workshop.startsAt) }}</span>
            <span class="home-workshops__name">{{ workshop.title }}</span>
            <span class="home-workshops__where">{{ workshop.location }}</span>
          </NuxtLink>
        </li>
      </ul>
      <NuxtLink :to="$localePath('/ateliere')" class="home-workshops__cta">
        {{ t("cta") }}
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { PublicWorkshop } from "~/types/workshop";

defineProps<{
  workshops: PublicWorkshop[];
}>();

const { t, locale } = useI18n({ useScope: "local" });
const localePath = useLocalePath();

function workshopLink(slug: string) {
  return localePath(`/ateliere/${slug}`);
}

function formatWhen(value: string) {
  return new Intl.DateTimeFormat(locale.value === "en" ? "en-GB" : "ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
</script>

<i18n lang="json">
{
  "ro": {
    "kicker": "Ateliere",
    "title": "Mai mult decât obiecte. Experiențe create cu mâinile tale.",
    "lead": "Descoperă bucuria de a lucra cu lutul și lasă-ți creativitatea să prindă formă în atelierul nostru.",
    "cta": "Descoperă atelierele"
  },
  "en": {
    "kicker": "Workshops",
    "title": "More than objects. Experiences shaped by your own hands.",
    "lead": "Discover the joy of working with clay and let your creativity take form in our studio.",
    "cta": "Discover the workshops"
  }
}
</i18n>

<style scoped lang="scss">
@use "./home" as *;
@use "../../assets/scss/functions" as *;

.home-workshops {
  background: $home-heading;
  color: $home-cream;
}

.home-workshops__inner {
  max-width: rem(760px);
  padding-top: rem(40px);
  padding-bottom: rem(40px);

  @media (min-width: 768px) {
    padding-top: rem(64px);
    padding-bottom: rem(64px);
  }
}

.home-workshops__kicker {
  margin: 0 0 rem(8px);
  color: $home-primary;
  font-size: rem(13px);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.home-workshops h2 {
  margin: 0;
  color: $home-cream;
  font-size: rem(28px);
  font-weight: 700;
  line-height: 1.2;

  @media (min-width: 768px) {
    font-size: rem(36px);
  }
}

.home-workshops p {
  margin: rem(14px) 0 rem(22px);
  font-size: rem(16px);
  line-height: 1.65;
}

.home-workshops__list {
  display: grid;
  gap: rem(12px);
  margin: 0 0 rem(22px);
  padding: 0;
  list-style: none;
}

.home-workshops__item {
  display: flex;
  flex-direction: column;
  gap: rem(2px);
  padding: rem(14px) rem(16px);
  border-radius: rem(8px);
  background: rgba(255, 249, 245, 0.08);
  color: $home-cream;
  text-decoration: none;
}

.home-workshops__item:hover {
  background: rgba(255, 249, 245, 0.14);
}

.home-workshops__item:focus-visible {
  outline: 2px solid $home-cream;
  outline-offset: 3px;
}

.home-workshops__when,
.home-workshops__where {
  font-size: rem(14px);
}

.home-workshops__name {
  font-size: rem(18px);
  font-weight: 700;
}

.home-workshops__cta {
  @include home-cta-on-dark;
}
</style>
