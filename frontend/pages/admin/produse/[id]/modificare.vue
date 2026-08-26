<template>
  <ProductEditor :product-id="productId" change-request />
</template>

<script setup>
import ProductEditor from "~/components/admin/ProductEditor.vue";

definePageMeta({
  layout: "admin",
  middleware: ["auth", "admin"],
});

const route = useRoute();
const productId = computed(() => Number(route.params.id));
</script>
