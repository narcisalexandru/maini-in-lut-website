import Aura from "@primeuix/themes/aura";
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  ssr: true,

  nitro: {
    preset: "netlify",
  },

  routeRules: {
    "/cos": { ssr: false },
    "/en/cart": { ssr: false },
    "/auth/**": { ssr: false },
    "/en/auth/**": { ssr: false },
    "/vinde-cu-noi": { ssr: false },
    "/en/sell-with-us": { ssr: false },
    "/login": { ssr: false },
    "/en/login": { ssr: false },
    "/admin/**": { ssr: false },
    "/en/admin/**": { ssr: false },
    "/profil/comenzi/**": { ssr: false },
    "/en/profile/orders/**": { ssr: false },
  },

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
  css: ["~/assets/scss/index.scss", "~/assets/css/main.css"],

  app: {
    head: {
      title: "Maini in Lut",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "description", content: "Maini in Lut" },
        { name: "color-scheme", content: "light" },
      ],
      link: [
        {
          rel: "icon",
          type: "image/x-icon",
          href: "/images/logo.png",
        },
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
          darkModeSelector: false,
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
      include: [
        "primevue/accordion",
        "primevue/accordionpanel",
        "primevue/accordionheader",
        "primevue/accordioncontent",
        "primevue/button",
        "primevue/checkbox",
        "primevue/column",
        "primevue/datatable",
        "primevue/dialog",
        "primevue/inputtext",
        "primevue/select",
        "primevue/slider",
        "primevue/tabpanel",
        "primevue/tabview",
        "primevue/tag",
        "primevue/textarea",
        "primevue/toast",
        "primevue/usetoast",
      ],
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
      apiBase:
        process.env.API_BASE_URL ||
        process.env.VITE_BACKEND_URL ||
        "http://localhost:4000",
    },
  },

  hooks: {
    "pages:extend"(pages) {
      // Catch-all must be last so /produs/:id matches before 404
      const idx = pages.findIndex(
        (p) =>
          p.path === "/:pathMatch(.*)*" ||
          (p.file && String(p.file).includes("slug"))
      );
      if (idx > -1) {
        const [catchAll] = pages.splice(idx, 1);
        pages.push(catchAll);
      }
    },
  },
});
