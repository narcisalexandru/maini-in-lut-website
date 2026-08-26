<template>
  <nav class="site-navbar h-bg-primary shadow-md px-4 md:px-12 select-none">
    <div class="w-full mx-auto">
      <div class="flex justify-between items-center h-16">
        <div class="flex md:hidden">
          <button
            @click="isOpen = !isOpen"
            class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
          >
            <i class="ph ph-list text-2xl" v-if="!isOpen"></i>
            <i class="ph ph-x text-2xl" v-else></i>
          </button>
        </div>

        <div class="flex-shrink-0">
          <NuxtLink :to="$localePath('/')">
            <nuxt-img
              src="/images/logo.png"
              alt="logo"
              class="img-responsive w-28"
              draggable="false"
            />
          </NuxtLink>
        </div>

        <div class="hidden md:flex md:items-center md:space-x-4">
          <nuxt-link
            v-for="item in menuItems"
            :key="item.to"
            :to="$localePath(item.to)"
            class="h-color-secondary hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
          >
            {{ item.label }}
          </nuxt-link>
        </div>

        <div class="flex items-center space-x-4">
          <NuxtLink
            v-if="showAdminLink"
            :to="$localePath('/admin')"
            class="site-navbar__admin-link hidden md:inline-flex"
          >
            {{ t("admin") }}
          </NuxtLink>
          <nuxt-link
            :to="$localePath('/favorite')"
            class="h-color-secondary hover:text-gray-900 relative"
          >
            <ClientOnly>
              <i
                :class="[
                  'ph text-xl',
                  favoritesCount > 0 ? 'ph-heart ph-fill' : 'ph-heart',
                ]"
              ></i>
              <span
                v-if="favoritesCount > 0"
                class="absolute -top-1 -right-1 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold px-1"
              >
                {{ favoritesCount > 99 ? "99+" : favoritesCount }}
              </span>
              <template #fallback>
                <i class="ph ph-heart text-xl"></i>
              </template>
            </ClientOnly>
          </nuxt-link>
          <nuxt-link
            :to="$localePath('/cos')"
            class="h-color-secondary hover:text-gray-900 relative"
          >
            <ClientOnly>
              <i class="ph ph-shopping-cart text-xl"></i>
              <span
                v-if="cartCount > 0"
                class="absolute -top-1 -right-1 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold px-1"
              >
                {{ cartCount > 99 ? "99+" : cartCount }}
              </span>
              <template #fallback>
                <i class="ph ph-shopping-cart text-xl"></i>
              </template>
            </ClientOnly>
          </nuxt-link>
          <nuxt-link
            :to="$localePath('/profil')"
            class="h-color-secondary hover:text-gray-900"
          >
            <i class="ph ph-user text-xl"></i>
          </nuxt-link>
        </div>
      </div>
    </div>

    <div class="md:hidden" v-if="isOpen">
      <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
        <NuxtLink
          v-if="showAdminLink"
          :to="$localePath('/admin')"
          class="site-navbar__admin-link site-navbar__admin-link--mobile block text-center mb-2"
          @click="isOpen = false"
        >
          {{ t("admin") }}
        </NuxtLink>
        <nuxt-link
          v-for="item in menuItems"
          :key="item.to"
          :to="$localePath(item.to)"
          class="text-gray-700 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
        >
          {{ item.label }}
        </nuxt-link>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed } from "vue";

const { favoritesCount, loadFavorites } = useFavorites();
const { cartCount } = useCart();
const { user, isAuthenticated, syncFromStorage } = useAuthState();

onMounted(() => {
  syncFromStorage();
  loadFavorites();
});

const { t } = useI18n({
  useScope: "local",
});

const isOpen = ref(false);

const showAdminLink = computed(() => {
  if (!isAuthenticated.value) {
    return false;
  }
  const role = user.value.role;
  return role === "SUPER_ADMIN" || role === "ARTIST";
});

const menuItems = computed(() => {
  const items = [
    {
      label: t("home"),
      to: "/",
    },
    {
      label: t("products"),
      to: "/produse",
    },
    {
      label: t("workshops"),
      to: "/ateliere",
    },
    {
      label: t("sellWithUs"),
      to: "/vinde-cu-noi",
    },
    {
      label: t("blog"),
      to: "/blog",
    },
    {
      label: t("contact"),
      to: "/contact",
    },
  ];

  if (showAdminLink.value) {
    return items.filter((item) => item.to !== "/vinde-cu-noi");
  }

  return items;
});
</script>

<style scoped>
.site-navbar,
.site-navbar a,
.site-navbar button,
.site-navbar img {
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}

.site-navbar__admin-link {
  align-items: center;
  justify-content: center;
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-decoration: none;
  color: #144111;
  background: rgba(255, 249, 245, 0.92);
  border: 1px solid rgba(255, 249, 245, 0.55);
  box-shadow: 0 1px 2px rgba(20, 65, 17, 0.12);
  transition: background-color 0.15s ease, transform 0.15s ease;
}

.site-navbar__admin-link:hover {
  background: #fff;
  transform: translateY(-1px);
}

.site-navbar__admin-link--mobile {
  display: inline-flex;
  width: fit-content;
  margin-left: 0.75rem;
}
</style>

<i18n lang="json">
{
  "en": {
    "home": "Home",
    "products": "Products",
    "workshops": "Workshops",
    "sellWithUs": "Sell with us",
    "blog": "Blog",
    "contact": "Contact",
    "admin": "Admin"
  },
  "ro": {
    "home": "Acasă",
    "products": "Produse",
    "workshops": "Ateliere",
    "sellWithUs": "Vinde cu noi",
    "blog": "Blog",
    "contact": "Contact",
    "admin": "Admin"
  }
}
</i18n>
