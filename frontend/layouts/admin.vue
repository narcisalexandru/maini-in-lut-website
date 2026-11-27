<template>
  <div class="layout-admin flex h-dvh flex-col overflow-hidden">
    <Navbar />
    <div class="flex min-h-0 flex-1 flex-col overflow-auto md:flex-row md:overflow-hidden">
      <AdminSidebar />
      <main class="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-gray-50 p-4 md:p-8">
        <div class="z-20 -mx-4 -mt-4 mb-6 shrink-0 border-b border-gray-200 bg-gray-50/95 px-4 py-3 backdrop-blur md:-mx-8 md:-mt-8 md:px-8">
          <AdminGlobalSearch />
        </div>
        <div class="flex min-h-0 flex-1 flex-col overflow-auto">
          <slot />
        </div>
      </main>
    </div>
    <Toast />
  </div>
</template>

<script setup>
import Navbar from "~/components/Navbar.vue";
import AdminSidebar from "~/components/admin/AdminSidebar.vue";
import AdminGlobalSearch from "~/components/admin/AdminGlobalSearch.vue";
import Toast from "primevue/toast";

const { loadUser } = useAuth();

onMounted(() => {
  loadUser();
});
</script>
