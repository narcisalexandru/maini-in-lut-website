<template>
  <nav class="h-bg-primary shadow-md px-4 md:px-12 relative">
    <div class="w-full mx-auto">
      <div class="flex justify-between items-center h-16">
        <div class="flex md:hidden">
          <button
            @click.stop="isOpen = !isOpen"
            class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
          >
            <i class="ph ph-list text-2xl h-color-secondary" v-if="!isOpen"></i>
            <i class="ph ph-x text-2xl h-color-secondary" v-else></i>
          </button>
        </div>

        <div class="flex-shrink-0">
          <NuxtLink :to="$localePath('/')">
            <nuxt-img
              src="/images/logo.png"
              alt="logo"
              class="img-responsive w-28"
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
          <nuxt-link
            :to="$localePath('/favorite')"
            class="h-color-secondary hover:text-gray-900"
          >
            <i class="ph ph-heart text-xl"></i>
          </nuxt-link>
          <nuxt-link
            :to="$localePath('/cos')"
            class="h-color-secondary hover:text-gray-900"
          >
            <i class="ph ph-shopping-cart text-xl"></i>
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
      <div
        ref="mobileMenu"
        @click.stop
        class="absolute left-0 right-0 top-16 z-50 px-2 pt-2 pb-3 space-y-1 sm:px-3 h-bg-primary shadow-lg"
      >
        <nuxt-link
          v-for="item in menuItems"
          :key="item.to"
          :to="$localePath(item.to)"
          class="h-color-secondary hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
          @click="isOpen = false"
        >
          {{ item.label }}
        </nuxt-link>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const { t } = useI18n({
  useScope: "local",
});

const isOpen = ref(false);
const mobileMenu = ref(null);

const handleClickOutside = (event) => {
  if (
    isOpen.value &&
    mobileMenu.value &&
    !mobileMenu.value.contains(event.target)
  ) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

const menuItems = [
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
    label: t("blog"),
    to: "/blog",
  },
  {
    label: t("contact"),
    to: "/contact",
  },
];
</script>

<i18n lang="json">
{
  "en": {
    "home": "Home",
    "products": "Products",
    "workshops": "Workshops",
    "blog": "Blog",
    "contact": "Contact"
  },
  "ro": {
    "home": "Acasă",
    "products": "Produse",
    "workshops": "Ateliere",
    "blog": "Blog",
    "contact": "Contact"
  }
}
</i18n>
