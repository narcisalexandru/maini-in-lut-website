<template>
  <div>
    <Navbar />
    <slot />
    <Footer v-if="!isAuthRoute" />
  </div>
</template>

<script setup>
import Navbar from "~/components/Navbar.vue";
import Footer from "~/components/Footer.vue";
import { useRoute } from "vue-router";
import { computed } from "vue";

const route = useRoute();
const isAuthRoute = computed(() => {
  return ["/login", "/register", "/profil"].includes(route.path);
});
</script>
