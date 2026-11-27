<template>
  <ProductEditor :product-id="productId" super-admin-edit />
</template>

<script setup>
import ProductEditor from "~/components/admin/ProductEditor.vue";

definePageMeta({
  layout: "admin",
  middleware: ["auth", "admin", "super-admin"],
});

const route = useRoute();
const productId = computed(() => Number(route.params.id));
</script>
