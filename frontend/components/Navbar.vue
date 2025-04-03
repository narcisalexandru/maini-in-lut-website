<template>
  <div class="card">
    <Menubar :model="items" />
  </div>
</template>

<script setup>
import { ref } from "vue";

const { t } = useI18n();

const items = ref([
  {
    label: t("home"),
    icon: "pi pi-home",
  },
  {
    label: t("features"),
    icon: "pi pi-star",
  },
]);
</script>

<i18n lang="json">
{
  "en": {
    "home": "Home",
    "features": "Features"
  },
  "ro": {
    "home": "Acasă",
    "features": "Funcții"
  }
}
</i18n>
