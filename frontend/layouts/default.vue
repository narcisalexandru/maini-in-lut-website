<template>
  <div class="layout-default">
    <Navbar />
    <main class="layout-default__main">
      <slot />
    </main>
    <Footer v-if="!isAuthRoute" />
    <Toast />
  </div>
</template>

<script setup>
import Navbar from "~/components/Navbar.vue";
import Footer from "~/components/Footer.vue";
import Toast from "primevue/toast";
import { useRoute } from "vue-router";
import { computed } from "vue";

const route = useRoute();
const { loadFavorites } = useFavorites();

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
