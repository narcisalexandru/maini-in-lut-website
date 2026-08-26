<template>
  <div class="layout-admin min-h-screen flex flex-col">
    <Navbar />
    <div class="flex flex-col md:flex-row flex-1">
      <AdminSidebar />
      <main class="flex-1 p-4 md:p-8 bg-gray-50">
        <slot />
      </main>
    </div>
    <Toast />
  </div>
</template>

<script setup>
import Navbar from "~/components/Navbar.vue";
import AdminSidebar from "~/components/admin/AdminSidebar.vue";
import Toast from "primevue/toast";

const { loadUser } = useAuth();

onMounted(() => {
  loadUser();
});
</script>
