import Aura from "@primeuix/themes/aura";
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  imports: {
    autoImport: true,
  },
  modules: [
    "@primevue/nuxt-module",
    "@nuxt/image",
    "@nuxtjs/i18n",
    "@vueuse/nuxt",
    "@pinia/nuxt",
  ],
  css: ["~/assets/css/main.css", "~/assets/scss/index.scss"],

  app: {
    head: {
      title: "Maini in Lut",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "description", content: "Maini in LUT - Website" },
      ],
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        {
          rel: "stylesheet",
          type: "text/css",
          href: "https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/regular/style.css",
        },
        {
          rel: "stylesheet",
          type: "text/css",
          href: "https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.1/src/fill/style.css",
        },
      ],
    },
  },

  primevue: {
    options: {
      ripple: true,
      inputVariant: "filled",
      theme: {
        preset: Aura,
        options: {
          prefix: "p",
          darkModeSelector: "system",
          cssLayer: false,
        },
      },
    },
  },

  vite: {
    cacheDir: "node_modules/.vite_cache",
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ["primevue/menubar"],
    },
  },

  i18n: {
    locales: [
      { code: "ro", language: "ro-RO", iso: "ro-RO", name: "Română" },
      { code: "en", language: "en-US", iso: "en-US", name: "English" },
    ],
    strategy: "prefix_except_default",
    defaultLocale: "ro",
    lazy: true,
    detectBrowserLanguage: false,
    bundle: {
      optimizeTranslationDirective: false,
    },
  },

  runtimeConfig: {
    public: {
      apiBase: import.meta.env.API_BASE_URL || "http://localhost:4000",
    },
  },

  compatibilityDate: "2025-04-02",
});
