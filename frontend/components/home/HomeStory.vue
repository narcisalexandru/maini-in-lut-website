<template>
  <section class="home-story" aria-labelledby="home-story-title">
    <div class="maini-ui__container home-story__grid">
      <figure v-if="imageSrc" class="home-story__figure">
        <img
          :src="imageSrc"
          :alt="imageAlt"
          width="900"
          height="1120"
          loading="lazy"
          decoding="async"
        />
      </figure>
      <div class="home-story__copy">
        <p class="home-story__kicker">{{ t("kicker") }}</p>
        <h2 id="home-story-title" class="home-story__title">{{ t("title") }}</h2>
        <p>{{ t("paragraphOne") }}</p>
        <p>{{ t("paragraphTwo") }}</p>
        <p>{{ t("paragraphThree") }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  imageSrc: string;
  imageAlt: string;
}>();

const { t } = useI18n({ useScope: "local" });
</script>

<i18n lang="json">
{
  "ro": {
    "kicker": "Atelierul",
    "title": "Fiecare poveste începe cu o bucată de lut.",
    "paragraphOne": "Mâini în lut a crescut din dorința de a transforma un material simplu în obiecte care aduc frumusețe și sens în lucrurile de zi cu zi.",
    "paragraphTwo": "Din mâinile noastre, fiecare piesă își găsește forma, iar din fiecare formă începe o nouă poveste.",
    "paragraphThree": "Lucrăm în Sibiu, cu răbdare și respect pentru meșteșug, ca piesele să rămână aproape de ritualurile obișnuite: cafeaua de dimineață, masa, un colț al casei."
  },
  "en": {
    "kicker": "The studio",
    "title": "Every story begins with a piece of clay.",
    "paragraphOne": "Mâini în lut grew from a wish to turn a simple material into objects that bring beauty and meaning to everyday things.",
    "paragraphTwo": "In our hands, each piece finds its form, and from each form a new story begins.",
    "paragraphThree": "We work in Sibiu, with patience and respect for the craft, so the pieces stay close to ordinary rituals: morning coffee, the table, a corner of the home."
  }
}
</i18n>

<style scoped lang="scss">
@use "./home" as *;
@use "../../assets/scss/functions" as *;

.home-story {
  padding: rem(36px) 0;
  background: $home-white;

  @media (min-width: 768px) {
    padding: rem(56px) 0;
  }
}

.home-story__grid {
  display: grid;
  gap: rem(24px);
  align-items: center;

  @media (min-width: 992px) {
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
    gap: rem(48px);
  }
}

.home-story__figure {
  margin: 0;
  overflow: hidden;
  border-radius: rem(8px);
  background: $home-line;
}

.home-story__figure img {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 4 / 5;
  object-fit: cover;
}

.home-story__kicker {
  @include home-kicker;
}

.home-story__title {
  @include home-title;
  margin-bottom: rem(16px);
}

.home-story__copy p {
  margin: 0 0 rem(14px);
  max-width: rem(620px);
  color: $home-ink;
  font-size: rem(16px);
  line-height: 1.7;
}

.home-story__copy p:last-child {
  margin-bottom: 0;
}
</style>
