<template>
  <aside class="admin-sidebar h-bg-white border-r border-gray-200 p-4 w-full md:w-64 shrink-0">
    <div class="mb-6">
      <NuxtLink :to="$localePath('/admin')" class="font-bold h-color-palm-leaf text-lg">
        {{ t("panelTitle") }}
      </NuxtLink>
      <div class="mt-2">
        <UserRoleBadge variant="admin" />
      </div>
    </div>
    <nav class="flex flex-col gap-1">
      <NuxtLink
        v-for="item in visibleItems"
        :key="item.to"
        :to="$localePath(item.to)"
        class="admin-sidebar__link px-3 py-2 rounded-lg text-sm font-medium"
        :class="{ 'admin-sidebar__link--highlight': item.highlight }"
        active-class="admin-sidebar__link--active"
      >
        <i :class="['ph', item.icon, 'mr-2']"></i>
        {{ item.label }}
      </NuxtLink>
    </nav>
    <div class="mt-8 pt-4 border-t border-gray-200">
      <NuxtLink
        :to="$localePath('/')"
        class="text-sm h-color-lunar-green hover:underline flex items-center gap-2"
      >
        <i class="ph ph-arrow-left"></i>
        {{ t("backToShop") }}
      </NuxtLink>
    </div>
  </aside>
</template>

<script setup lang="ts">
const { t } = useI18n({ useScope: "local" });
const { isSuperAdmin, isArtist } = useAuth();

const visibleItems = computed(() => {
  const items = [
    {
      to: "/admin/jurnal",
      label: t("auditLog"),
      icon: "ph-scroll",
      show: isSuperAdmin.value,
      highlight: true,
    },
    {
      to: "/admin",
      label: t("dashboard"),
      icon: "ph-house",
      show: true,
    },
    {
      to: "/admin/artisti",
      label: t("artists"),
      icon: "ph-users-three",
      show: isSuperAdmin.value,
    },
    {
      to: "/admin/produse",
      label: t("products"),
      icon: "ph-package",
      show: isArtist.value || isSuperAdmin.value,
    },
    {
      to: "/admin/clienti",
      label: t("customers"),
      icon: "ph-user-circle",
      show: isSuperAdmin.value,
    },
    {
      to: "/admin/comenzi",
      label: t("orders"),
      icon: "ph-receipt",
      show: isArtist.value || isSuperAdmin.value,
    },
  ];
  return items.filter((item) => item.show);
});
</script>

<style scoped>
.admin-sidebar__link {
  color: var(--color-lunar-green, #4a5d3b);
}

.admin-sidebar__link:hover {
  background: #f3f4f6;
}

.admin-sidebar__link--active {
  background: #eef2e6;
  color: var(--color-palm-leaf, #5c6b4a);
}

.admin-sidebar__link--highlight {
  background: #fff7ed;
  border: 1px solid #d97706;
  color: #92400e;
  font-weight: 700;
}

.admin-sidebar__link--highlight:hover {
  background: #ffedd5;
}

.admin-sidebar__link--highlight.admin-sidebar__link--active {
  background: #fed7aa;
  color: #7c2d12;
}
</style>

<i18n lang="json">
{
  "ro": {
    "panelTitle": "Panou admin",
    "dashboard": "Dashboard",
    "artists": "Artiști",
    "customers": "Clienți",
    "products": "Produse",
    "orders": "Comenzi",
    "auditLog": "Jurnal activitate",
    "backToShop": "Înapoi la magazin"
  },
  "en": {
    "panelTitle": "Admin panel",
    "dashboard": "Dashboard",
    "artists": "Artists",
    "customers": "Customers",
    "products": "Products",
    "orders": "Orders",
    "auditLog": "Activity log",
    "backToShop": "Back to shop"
  }
}
</i18n>
