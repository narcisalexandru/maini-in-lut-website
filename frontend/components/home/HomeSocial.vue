<template>
  <section class="home-social" aria-labelledby="home-social-title">
    <div class="maini-ui__container home-social__inner">
      <div>
        <h2 id="home-social-title">{{ t("title") }}</h2>
        <p>{{ t("lead") }}</p>
      </div>
      <a
        class="home-social__link"
        :href="instagramHref"
        target="_blank"
        rel="noopener noreferrer"
      >
        <i class="ph ph-instagram-logo" aria-hidden="true"></i>
        <span>{{ t("cta") }}</span>
      </a>
    </div>
  </section>
</template>

<script setup lang="ts">
import { SOCIAL_LINKS } from "~/constants/company";

const { t } = useI18n({ useScope: "local" });

const instagramHref =
  SOCIAL_LINKS.find((link) => link.icon === "ph-instagram-logo")?.href ??
  SOCIAL_LINKS[0].href;
</script>

<i18n lang="json">
{
  "ro": {
    "title": "Urmărește atelierul",
    "lead": "Pe Instagram publicăm piese noi, detalii din lucru și momente din atelier.",
    "cta": "Instagram"
  },
  "en": {
    "title": "Follow the studio",
    "lead": "On Instagram we share new pieces, details from the making, and moments from the studio.",
    "cta": "Instagram"
  }
}
</i18n>

<style scoped lang="scss">
@use "./home" as *;
@use "../../assets/scss/functions" as *;

.home-social {
  border-top: 1px solid $home-line;
}

.home-social__inner {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: rem(16px);
  padding-top: rem(28px);
  padding-bottom: rem(28px);

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding-top: rem(36px);
    padding-bottom: rem(36px);
  }
}

.home-social h2 {
  margin: 0;
  color: $home-heading;
  font-size: rem(24px);
  font-weight: 700;
}

.home-social p {
  margin: rem(6px) 0 0;
  max-width: rem(520px);
  color: $home-ink;
  font-size: rem(15px);
  line-height: 1.55;
}

.home-social__link {
  @include home-cta-primary;
  gap: rem(8px);
}

.home-social__link i {
  font-size: rem(18px);
}
</style>
