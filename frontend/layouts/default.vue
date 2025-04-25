<template>
  <div>
    <Navbar />
    <slot />
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
const isAuthRoute = computed(() => {
  return [
    "/login",
    "/register",
    "/profile",
    "/auth/email-verification",
  ].includes(route.path);
});
</script>
