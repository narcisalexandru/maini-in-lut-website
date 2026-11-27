<template>
  <ProductEditor />
</template>

<script setup>
import ProductEditor from "~/components/admin/ProductEditor.vue";

definePageMeta({
  layout: "admin",
  middleware: ["auth", "admin"],
});
</script>
