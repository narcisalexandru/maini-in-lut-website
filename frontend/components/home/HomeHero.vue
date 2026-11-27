<template>
  <section class="home-hero" aria-labelledby="home-hero-title">
    <div class="maini-ui__container home-hero__grid">
      <div class="home-hero__copy">
        <p class="home-hero__kicker">{{ t("kicker") }}</p>
        <h1 id="home-hero-title" class="home-hero__title">{{ t("title") }}</h1>
        <p class="home-hero__lead">{{ t("lead") }}</p>
        <NuxtLink :to="$localePath('/produse')" class="home-hero__cta">
          {{ t("cta") }}
        </NuxtLink>
      </div>
      <div class="home-hero__media">
        <NuxtImg
          src="/images/hero_background.jpg"
          :alt="t('imageAlt')"
          width="1200"
          height="690"
          densities="1"
          format="webp"
          preload
          class="home-hero__image"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const { t } = useI18n({ useScope: "local" });
</script>

<i18n lang="json">
{
  "ro": {
    "kicker": "Ceramică lucrată manual",
    "title": "Obiecte create cu suflet, din pământ și răbdare.",
    "lead": "Descoperă piese ceramice lucrate manual, în care fiecare formă, textură și detaliu poartă amprenta mâinilor care le-au creat.",
    "cta": "Descoperă colecția",
    "imageAlt": "Mâini care finisează o piesă ceramică"
  },
  "en": {
    "kicker": "Handmade ceramics",
    "title": "Objects shaped with care, from clay and patience.",
    "lead": "Discover handmade ceramic pieces, where every form, texture, and detail carries the mark of the hands that made them.",
    "cta": "Explore the collection",
    "imageAlt": "Hands finishing a ceramic piece"
  }
}
</i18n>

<style scoped lang="scss">
@use "./home" as *;
@use "../../assets/scss/functions" as *;
@use "../../assets/scss/variables" as *;

.home-hero {
  padding: rem(20px) 0 rem(8px);

  @media (min-width: 768px) {
    padding: rem(36px) 0 rem(12px);
  }
}

.home-hero__grid {
  display: grid;
  gap: rem(24px);
  align-items: center;

  @media (min-width: 992px) {
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
    gap: rem(48px);
  }
}

.home-hero__media {
  order: -1;
  overflow: hidden;
  border-radius: rem(8px);
  background: $alto;

  @media (min-width: 992px) {
    order: 0;
  }
}

.home-hero__image {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  object-position: 62% 42%;

  @media (min-width: 992px) {
    aspect-ratio: 5 / 4;
  }
}

.home-hero__kicker {
  @include home-kicker;
}

.home-hero__title {
  margin: 0;
  max-width: rem(640px);
  color: $home-heading;
  font-size: rem(32px);
  font-weight: 700;
  line-height: 1.15;

  @media (min-width: 768px) {
    font-size: rem(44px);
  }
}

.home-hero__lead {
  @include home-lead;
  margin-bottom: rem(22px);
}

.home-hero__cta {
  @include home-cta-primary;
}
</style>
