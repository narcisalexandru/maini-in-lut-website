<template>
  <div class="card">
    <Menubar :model="items">
      <template #item="{ item }">
        <NuxtLink :to="$localePath(item.to)" class="p-menuitem-link">
          <span :class="item.icon"></span>
          <span class="p-menuitem-text">{{ item.label }}</span>
        </NuxtLink>
      </template>
    </Menubar>
  </div>
</template>

<script setup>
import { ref } from "vue";

const { t } = useI18n({
  useScope: "local",
});

const items = ref([
  {
    label: t("home"),
    icon: "ph ph-house",
    to: "/",
  },
  {
    label: t("products"),
    icon: "ph ph-pottery",
    to: "/produse",
  },
  {
    label: t("workshops"),
    icon: "ph ph-chalkboard-teacher",
    to: "/ateliere",
  },
  {
    label: t("blog"),
    icon: "ph ph-newspaper",
    to: "/blog",
  },
  {
    label: t("contact"),
    icon: "ph ph-envelope",
    to: "/contact",
  },
  {
    label: "",
    icon: "ph ph-user",
    to: "/profil",
  },
]);
</script>

<i18n lang="json">
{
  "en": {
    "home": "Home",
    "products": "Products",
    "workshops": "Workshops",
    "blog": "Blog",
    "contact": "Contact"
  },
  "ro": {
    "home": "Acasă",
    "products": "Produse",
    "workshops": "Ateliere",
    "blog": "Blog",
    "contact": "Contact"
  }
}
</i18n>
