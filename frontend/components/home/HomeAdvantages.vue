<template>
  <section class="home-advantages" aria-labelledby="home-advantages-title">
    <div class="maini-ui__container">
      <h2 id="home-advantages-title" class="home-advantages__title">
        {{ t("title") }}
      </h2>
      <ul class="home-advantages__list">
        <li v-for="item in items" :key="item.title" class="home-advantages__item">
          <i class="ph" :class="item.icon" aria-hidden="true"></i>
          <h3>{{ item.title }}</h3>
          <p>{{ item.text }}</p>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
const { t } = useI18n({ useScope: "local" });

const items = computed(() => [
  {
    icon: "ph-hand",
    title: t("handmadeTitle"),
    text: t("handmadeText"),
  },
  {
    icon: "ph-fingerprint",
    title: t("characterTitle"),
    text: t("characterText"),
  },
  {
    icon: "ph-plant",
    title: t("materialsTitle"),
    text: t("materialsText"),
  },
  {
    icon: "ph-seal-check",
    title: t("careTitle"),
    text: t("careText"),
  },
]);
</script>

<i18n lang="json">
{
  "ro": {
    "title": "Lucrate cu grijă",
    "handmadeTitle": "Lucrate manual",
    "handmadeText": "Fiecare formă trece prin mâini, nu printr-o linie de producție.",
    "characterTitle": "Fiecare piesă are caracterul ei",
    "characterText": "Micile variații de formă și textură fac parte din piesă.",
    "materialsTitle": "Materiale atent alese",
    "materialsText": "Lutul și glazura sunt alese pentru obiecte folosite zi de zi.",
    "careTitle": "De la modelare până la finisaj",
    "careText": "Piesa pleacă din atelier doar după ce e verificată cu atenție."
  },
  "en": {
    "title": "Made with care",
    "handmadeTitle": "Shaped by hand",
    "handmadeText": "Every form passes through hands, not a production line.",
    "characterTitle": "Each piece has its own character",
    "characterText": "Small variations in form and texture belong to the piece.",
    "materialsTitle": "Materials chosen with care",
    "materialsText": "Clay and glaze are chosen for objects used every day.",
    "careTitle": "From shaping to the final finish",
    "careText": "A piece leaves the studio only after it has been checked with care."
  }
}
</i18n>

<style scoped lang="scss">
@use "./home" as *;
@use "../../assets/scss/functions" as *;

.home-advantages {
  padding: rem(36px) 0 rem(12px);

  @media (min-width: 768px) {
    padding: rem(48px) 0 rem(16px);
  }
}

.home-advantages__title {
  @include home-title;
  margin-bottom: rem(20px);
}

.home-advantages__list {
  display: grid;
  gap: rem(18px);
  margin: 0;
  padding: 0;
  list-style: none;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: rem(22px) rem(32px);
  }

  @media (min-width: 992px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.home-advantages__item {
  padding-top: rem(14px);
  border-top: 1px solid $home-line;
}

.home-advantages__item i {
  display: block;
  margin-bottom: rem(10px);
  color: $home-heading;
  font-size: rem(26px);
}

.home-advantages__item h3 {
  margin: 0 0 rem(6px);
  color: $home-heading;
  font-size: rem(17px);
  font-weight: 700;
  line-height: 1.3;
}

.home-advantages__item p {
  margin: 0;
  color: $home-ink;
  font-size: rem(14px);
  line-height: 1.55;
}
</style>
