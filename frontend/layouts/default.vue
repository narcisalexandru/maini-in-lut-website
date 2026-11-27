<template>
  <div class="layout-default">
    <Navbar />
    <HomeDeliveryNote v-if="!isAuthRoute && announcement" :settings="announcement" />
    <main class="layout-default__main">
      <slot />
    </main>
    <Footer v-if="!isAuthRoute" />
    <Toast />
  </div>
</template>

<script setup>
import Navbar from "~/components/Navbar.vue";
import HomeDeliveryNote from "~/components/home/HomeDeliveryNote.vue";
import Footer from "~/components/Footer.vue";
import Toast from "primevue/toast";
import { useRoute } from "vue-router";
import { computed } from "vue";
import { DEFAULT_SITE_SETTINGS } from "~/composables/useSiteSettings";

const route = useRoute();
const { loadFavorites } = useFavorites();
const { getPublicSettings } = useSiteSettings();
const { data: announcement } = await useAsyncData("announcement-bar", () =>
  getPublicSettings().catch(() => ({ ...DEFAULT_SITE_SETTINGS })),
);

onMounted(() => {
  loadFavorites();
});
const isAuthRoute = computed(() => {
  return [
    "/login",
    "/register",
    "/profile",
    "/auth/email-verification",
  ].includes(route.path);
});
</script>

<style scoped lang="scss">
.layout-default {
  display: flex;
  flex-direction: column;
  min-height: 100vh;

  &__main {
    flex: 1 0 auto;
  }
}
</style>
