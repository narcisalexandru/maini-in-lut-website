<template>
  <section class="home-process" aria-labelledby="home-process-title">
    <div class="maini-ui__container">
      <h2 id="home-process-title" class="home-process__title">{{ t("title") }}</h2>
      <p class="home-process__lead">{{ t("lead") }}</p>
      <ol class="home-process__list">
        <li v-for="(step, index) in steps" :key="step.title">
          <span class="home-process__index" aria-hidden="true">
            {{ String(index + 1).padStart(2, "0") }}
          </span>
          <h3>{{ step.title }}</h3>
          <p>{{ step.text }}</p>
        </li>
      </ol>
    </div>
  </section>
</template>

<script setup lang="ts">
const { t } = useI18n({ useScope: "local" });

const steps = computed(() => [
  { title: t("shapeTitle"), text: t("shapeText") },
  { title: t("dryTitle"), text: t("dryText") },
  { title: t("fireTitle"), text: t("fireText") },
  { title: t("glazeTitle"), text: t("glazeText") },
  { title: t("finishTitle"), text: t("finishText") },
]);
</script>

<i18n lang="json">
{
  "ro": {
    "title": "Drumul unei piese",
    "lead": "Timpul face parte din obiect. Fiecare etapă lasă piesa să se așeze înainte de următoarea.",
    "shapeTitle": "Modelare",
    "shapeText": "Forma prinde contur în mâini.",
    "dryTitle": "Uscare",
    "dryText": "Piesa se odihnește până când lutul e pregătit.",
    "fireTitle": "Ardere",
    "fireText": "Focul fixează forma.",
    "glazeTitle": "Glazurare",
    "glazeText": "Suprafața primește culoare și textură.",
    "finishTitle": "Finisare",
    "finishText": "Detaliile sunt verificate înainte ca piesa să plece din atelier."
  },
  "en": {
    "title": "How a piece is made",
    "lead": "Time is part of the object. Each stage lets the piece settle before the next.",
    "shapeTitle": "Shaping",
    "shapeText": "The form takes shape in the hands.",
    "dryTitle": "Drying",
    "dryText": "The piece rests until the clay is ready.",
    "fireTitle": "Firing",
    "fireText": "Fire sets the form.",
    "glazeTitle": "Glazing",
    "glazeText": "The surface receives colour and texture.",
    "finishTitle": "Finishing",
    "finishText": "The details are checked before the piece leaves the studio."
  }
}
</i18n>

<style scoped lang="scss">
@use "./home" as *;
@use "../../assets/scss/functions" as *;

.home-process {
  padding: rem(36px) 0;

  @media (min-width: 768px) {
    padding: rem(56px) 0;
  }
}

.home-process__title {
  @include home-title;
}

.home-process__lead {
  @include home-lead;
  margin-bottom: rem(22px);
}

.home-process__list {
  display: grid;
  gap: rem(16px);
  margin: 0;
  padding: 0;
  list-style: none;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (min-width: 1100px) {
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: rem(18px);
  }
}

.home-process__list li {
  padding-top: rem(12px);
  border-top: 1px solid $home-line;
}

.home-process__index {
  display: block;
  margin-bottom: rem(8px);
  color: $home-primary;
  font-size: rem(13px);
  font-weight: 600;
  letter-spacing: 0.06em;
}

.home-process__list h3 {
  margin: 0 0 rem(6px);
  color: $home-heading;
  font-size: rem(17px);
  font-weight: 700;
}

.home-process__list p {
  margin: 0;
  color: $home-ink;
  font-size: rem(14px);
  line-height: 1.5;
}
</style>
