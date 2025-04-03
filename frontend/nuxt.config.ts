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
  css: ["~/assets/css/main.css"],
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
    plugins: [tailwindcss()],
  },

  i18n: {
    locales: [
      { code: "ro", language: "ro-RO" },
      { code: "en", language: "en-US" },
    ],
    defaultLocale: "ro",
    strategy: "prefix_except_default",
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "i18n_redirected",
      redirectOn: "root",
      alwaysRedirect: true,
      fallbackLocale: "ro",
    },
    bundle: {
      optimizeTranslationDirective: false,
    },
  },

  compatibilityDate: "2025-04-02",
});
