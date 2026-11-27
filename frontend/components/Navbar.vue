<template>
  <nav
    class="site-navbar h-bg-primary shadow-md px-4 md:px-12 select-none"
    :class="{ 'site-navbar--hidden': navbarHidden }"
  >
    <div class="w-full mx-auto">
      <div class="flex justify-between items-center h-16">
        <div class="flex md:hidden">
          <button
            type="button"
            class="site-navbar__toggle"
            :aria-expanded="isOpen"
            :aria-label="isOpen ? t('closeMenu') : t('openMenu')"
            @click="isOpen = !isOpen"
          >
            <i class="ph ph-list" v-if="!isOpen"></i>
            <i class="ph ph-x" v-else></i>
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

    <div v-if="isOpen" class="site-navbar__menu md:hidden">
      <NuxtLink
        v-if="showAdminLink"
        :to="$localePath('/admin')"
        class="site-navbar__menu-link"
        @click="isOpen = false"
      >
        <i class="ph ph-shield-check"></i>
        <span>{{ t("admin") }}</span>
      </NuxtLink>
      <NuxtLink
        v-for="item in menuItems"
        :key="item.to"
        :to="$localePath(item.to)"
        class="site-navbar__menu-link"
        :class="{ 'is-active': isCurrent(item.to) }"
        @click="isOpen = false"
      >
        <i class="ph" :class="item.icon"></i>
        <span>{{ item.label }}</span>
      </NuxtLink>
    </div>
  </nav>
  <button
    v-if="isOpen"
    type="button"
    class="site-navbar__backdrop md:hidden"
    :aria-label="t('closeMenu')"
    @click="isOpen = false"
  ></button>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";

const { favoritesCount, loadFavorites } = useFavorites();
const { cartCount } = useCart();
const { user, isAuthenticated, syncFromStorage } = useAuthState();

const navbarHidden = ref(false);
const isMobileNav = ref(false);
let lastScrollY = 0;

const updateNavMode = () => {
  isMobileNav.value = window.matchMedia("(max-width: 767px)").matches;
  if (!isMobileNav.value) {
    navbarHidden.value = false;
    isOpen.value = false;
  }
};

const onScroll = () => {
  if (!isMobileNav.value || isOpen.value) {
    navbarHidden.value = false;
    lastScrollY = window.scrollY;
    return;
  }

  const currentY = window.scrollY;
  const delta = currentY - lastScrollY;

  if (currentY <= 8) {
    navbarHidden.value = false;
  } else if (delta > 8) {
    navbarHidden.value = true;
  } else if (delta < -8) {
    navbarHidden.value = false;
  }

  lastScrollY = currentY;
};

onMounted(() => {
  syncFromStorage();
  loadFavorites();
  updateNavMode();
  lastScrollY = window.scrollY;
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", updateNavMode);
});

onUnmounted(() => {
  window.removeEventListener("scroll", onScroll);
  window.removeEventListener("resize", updateNavMode);
  document.body.style.overflow = "";
});

const { t } = useI18n({
  useScope: "local",
});
const route = useRoute();
const localePath = useLocalePath();

const isOpen = ref(false);

watch(isOpen, (open) => {
  if (open) {
    navbarHidden.value = false;
  }
  if (import.meta.client) {
    document.body.style.overflow = open ? "hidden" : "";
  }
});

watch(
  () => route.fullPath,
  () => {
    isOpen.value = false;
  },
);

const isCurrent = (to) => {
  const path = localePath(to);
  if (to === "/") {
    return route.path === path;
  }
  return route.path === path || route.path.startsWith(`${path}/`);
};

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
      icon: "ph-house",
    },
    {
      label: t("products"),
      to: "/produse",
      icon: "ph-storefront",
    },
    {
      label: t("workshops"),
      to: "/ateliere",
      icon: "ph-paint-brush",
    },
    {
      label: t("contact"),
      to: "/contact",
      icon: "ph-envelope",
    },
  ];

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

@media (max-width: 767px) {
  .site-navbar {
    position: sticky;
    top: 0;
    z-index: 40;
    transition: transform 0.28s ease;
  }

  .site-navbar--hidden {
    transform: translateY(-100%);
    pointer-events: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .site-navbar {
    transition: none;
  }
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

.site-navbar__toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  margin-left: -0.35rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #fff9f5;
  font-size: 1.65rem;
  line-height: 1;
  cursor: pointer;
}

.site-navbar__toggle:focus {
  outline: none;
}

.site-navbar__toggle:focus-visible {
  outline: 2px solid #fff9f5;
  outline-offset: 2px;
}

.site-navbar__menu {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin: 0 -1rem 0.75rem;
  padding: 0.65rem 0.75rem 0.85rem;
  background: #fff9f5;
  border-top: 1px solid rgba(255, 249, 245, 0.45);
}

.site-navbar__menu-link {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-height: 3rem;
  padding: 0 0.9rem;
  border-radius: 0.8rem;
  color: #144111;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
}

.site-navbar__menu-link i {
  width: 1.35rem;
  font-size: 1.25rem;
  text-align: center;
}

.site-navbar__menu-link.is-active {
  background: #8a9772;
  color: #fff9f5;
}

.site-navbar__backdrop {
  position: fixed;
  inset: 0;
  z-index: 30;
  border: 0;
  background: rgba(20, 24, 18, 0.28);
  cursor: pointer;
}
</style>

<i18n lang="json">
{
  "en": {
    "home": "Home",
    "products": "Products",
    "workshops": "Workshops",
    "contact": "Contact",
    "admin": "Admin",
    "openMenu": "Open menu",
    "closeMenu": "Close menu"
  },
  "ro": {
    "home": "Acasă",
    "products": "Produse",
    "workshops": "Ateliere",
    "contact": "Contact",
    "admin": "Admin",
    "openMenu": "Deschide meniul",
    "closeMenu": "Închide meniul"
  }
}
</i18n>
