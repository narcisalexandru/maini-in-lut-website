<template>
  <div class="maini-ui__section md:px-4">
    <div class="maini-ui__container-products py-10 md:py-14 max-w-3xl mx-auto">
      <nav class="flex mb-6 text-sm h-color-dusty-gray" aria-label="Breadcrumb">
        <ol class="flex flex-wrap items-center gap-1">
          <li>
            <NuxtLink :to="$localePath('/')" class="hover:h-color-primary">
              {{ t("breadcrumb.home") }}
            </NuxtLink>
          </li>
          <li><span class="mx-1">/</span></li>
          <li>
            <span class="h-color-lunar-green font-medium">{{
              breadcrumbCurrent
            }}</span>
          </li>
        </ol>
      </nav>

      <h1 class="text-3xl md:text-4xl font-bold h-color-lunar-green mb-2">
        {{ title }}
      </h1>
      <p class="text-sm text-gray-500 mb-8">{{ lastUpdated }}</p>

      <div class="space-y-8 text-gray-700 leading-relaxed">
        <section v-for="section in sections" :key="section.id">
          <h2 class="text-xl font-semibold h-color-lunar-green mb-3">
            {{ section.title }}
          </h2>
          <p
            v-for="(paragraph, index) in section.paragraphs"
            :key="index"
            class="mb-3 last:mb-0"
          >
            {{ paragraph }}
          </p>
        </section>
      </div>

      <div v-if="$slots.footer" class="mt-10 pt-6 border-t border-gray-200">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
};

defineProps<{
  breadcrumbCurrent: string;
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
}>();

const { t } = useI18n({ useScope: "local" });
</script>

<i18n lang="json">
{
  "ro": {
    "breadcrumb": {
      "home": "Acasă"
    }
  },
  "en": {
    "breadcrumb": {
      "home": "Home"
    }
  }
}
</i18n>
