<template>
  <div>
    <Navbar />
    <slot />
    <Footer />
  </div>
</template>

<script setup>
import Navbar from "~/components/Navbar.vue";
import Footer from "~/components/Footer.vue";
</script>
