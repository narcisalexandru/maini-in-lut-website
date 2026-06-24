<template>
  <div>
    <h1 class="text-2xl font-bold h-color-lunar-green mb-2">{{ t("title") }}</h1>
    <div class="flex flex-wrap items-center gap-3 mb-8">
      <p class="h-color-lunar-green">{{ t("subtitle") }}</p>
      <UserRoleBadge variant="admin" />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <NuxtLink
        v-if="isSuperAdmin"
        :to="$localePath('/admin/artisti')"
        class="h-bg-white rounded-xl shadow p-6 hover:shadow-md transition-shadow"
      >
        <i class="ph ph-users-three text-2xl h-color-palm-leaf mb-3 block"></i>
        <h2 class="font-semibold h-color-lunar-green">{{ t("artists") }}</h2>
        <p class="text-sm h-color-lunar-green mt-1">{{ t("artistsDesc") }}</p>
      </NuxtLink>

      <NuxtLink
        v-if="isArtist || isSuperAdmin"
        :to="$localePath('/admin/produse')"
        class="h-bg-white rounded-xl shadow p-6 hover:shadow-md transition-shadow"
      >
        <i class="ph ph-package text-2xl h-color-palm-leaf mb-3 block"></i>
        <h2 class="font-semibold h-color-lunar-green">{{ t("products") }}</h2>
        <p class="text-sm h-color-lunar-green mt-1">{{ t("productsDesc") }}</p>
      </NuxtLink>

      <NuxtLink
        v-if="isArtist || isSuperAdmin"
        :to="$localePath('/admin/comenzi')"
        class="h-bg-white rounded-xl shadow p-6 hover:shadow-md transition-shadow"
      >
        <i class="ph ph-receipt text-2xl h-color-palm-leaf mb-3 block"></i>
        <h2 class="font-semibold h-color-lunar-green">{{ t("orders") }}</h2>
        <p class="text-sm h-color-lunar-green mt-1">{{ t("ordersDesc") }}</p>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: "admin",
  middleware: ["auth", "admin"],
});

const { t } = useI18n({ useScope: "local" });
const { isSuperAdmin, isArtist, loadUser } = useAuth();

onMounted(() => {
  loadUser();
});
</script>

<i18n lang="json">
{
  "ro": {
    "title": "Dashboard",
    "subtitle": "Gestionează platforma din panoul de administrare.",
    "artists": "Artiști",
    "artistsDesc": "Aprobă cereri de înscriere și gestionează artiștii.",
    "products": "Produse",
    "productsDesc": "Publică și validează produsele.",
    "orders": "Comenzi",
    "ordersDesc": "Urmărește și actualizează statusul comenzilor."
  },
  "en": {
    "title": "Dashboard",
    "subtitle": "Manage the platform from the admin panel.",
    "artists": "Artists",
    "artistsDesc": "Approve applications and manage artists.",
    "products": "Products",
    "productsDesc": "Publish and review products.",
    "orders": "Orders",
    "ordersDesc": "Track and update order status."
  }
}
</i18n>
