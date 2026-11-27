<template>
  <nav class="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
    <NuxtLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
      :class="
        isActive(item)
          ? 'bg-lunar-green/10 text-lunar-green'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      "
    >
      <i :class="item.icon"></i>
      {{ item.label }}
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
const props = defineProps<{
  artistId: number;
}>();

const { t } = useI18n({ useScope: "local" });
const localePath = useLocalePath();
const route = useRoute();

const items = computed(() => [
  {
    label: t("profile"),
    icon: "ph ph-user",
    to: localePath(`/admin/artisti/${props.artistId}`),
    exact: true,
  },
  {
    label: t("products"),
    icon: "ph ph-package",
    to: localePath(`/admin/artisti/${props.artistId}/produse`),
  },
  {
    label: t("orders"),
    icon: "ph ph-shopping-bag",
    to: localePath(`/admin/artisti/${props.artistId}/comenzi`),
  },
  {
    label: t("activity"),
    icon: "ph ph-scroll",
    to: localePath(`/admin/artisti/${props.artistId}/jurnal`),
  },
]);

const isActive = (item: { to: string; exact?: boolean }) => {
  if (item.exact) {
    return route.path === item.to;
  }
  return route.path.startsWith(item.to);
};
</script>

<i18n lang="json">
{
  "ro": {
    "profile": "Profil",
    "products": "Produse",
    "orders": "Comenzi",
    "activity": "Istoric acțiuni"
  },
  "en": {
    "profile": "Profile",
    "products": "Products",
    "orders": "Orders",
    "activity": "Activity history"
  }
}
</i18n>

<style scoped>
.text-lunar-green {
  color: var(--palm-leaf, #4a5d3f);
}
.bg-lunar-green\/10 {
  background-color: rgb(74 93 63 / 0.1);
}
</style>
