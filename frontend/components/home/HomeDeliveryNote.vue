<template>
  <aside v-if="message" class="home-delivery" :aria-label="t('label')">
    <div class="maini-ui__container home-delivery__inner">
      <i class="ph ph-truck" aria-hidden="true"></i>
      <p class="home-delivery__text">
        {{ message }}
        <NuxtLink :to="$localePath('/terms-and-conditions')" class="home-delivery__link">
          {{ t("details") }}
        </NuxtLink>
      </p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { SiteSettings } from "~/composables/useSiteSettings";

const props = defineProps<{
  settings: SiteSettings;
}>();

const { t, locale } = useI18n({ useScope: "local" });

const message = computed(() => {
  const template =
    locale.value === "en"
      ? props.settings.announcementTextEn
      : props.settings.announcementTextRo;
  return template
    .replaceAll("{min}", String(props.settings.deliveryDaysMin))
    .replaceAll("{max}", String(props.settings.deliveryDaysMax))
    .replaceAll("{easybox}", String(props.settings.easyboxFeeRon))
    .replaceAll("{address}", String(props.settings.addressFeeRon));
});
</script>

<i18n lang="json">
{
  "ro": {
    "label": "Informații de livrare",
    "details": "Detalii"
  },
  "en": {
    "label": "Delivery information",
    "details": "Details"
  }
}
</i18n>

<style scoped lang="scss">
@use "../../assets/scss/functions" as *;
@use "../../assets/scss/variables" as *;

.home-delivery {
  background: $alto;
  color: $lunar-green;
}

.home-delivery__inner {
  display: flex;
  align-items: flex-start;
  gap: rem(10px);
  padding-top: rem(10px);
  padding-bottom: rem(10px);
  font-size: rem(14px);
  line-height: 1.45;
}

.home-delivery__inner i {
  margin-top: rem(2px);
  font-size: rem(18px);
  color: $palm-leaf;
}

.home-delivery__text {
  margin: 0;
}

.home-delivery__link {
  margin-left: rem(6px);
  color: $palm-leaf;
  font-weight: 600;
  white-space: nowrap;
}

.home-delivery__link:hover {
  text-decoration: underline;
}

.home-delivery__link:focus-visible {
  outline: 2px solid $palm-leaf;
  outline-offset: 2px;
}
</style>
