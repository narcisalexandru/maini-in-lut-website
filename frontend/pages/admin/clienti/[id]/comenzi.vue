<template>
  <AdminOrdersPanel :fixed-user-id="userId" />
</template>

<script setup>
import AdminOrdersPanel from "~/components/admin/AdminOrdersPanel.vue";

const clientContext = inject("clientAdminUser", null);
const userId = computed(() => clientContext?.userId?.value ?? Number(useRoute().params.id));
</script>
