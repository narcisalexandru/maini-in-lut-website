import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Aura from "@primeuix/themes/aura";
import tailwindcss from "@tailwindcss/vite";

function resolveBackendUrl(): string {
  const fromProcess = process.env.BACKEND_URL?.trim();
  if (fromProcess) {
    return fromProcess.replace(/\/$/, "");
  }

  const candidates = [
    resolve(process.cwd(), "../backend/.env"),
    resolve(process.cwd(), "backend/.env"),
    resolve(fileURLToPath(new URL(".", import.meta.url)), "../backend/.env"),
  ];
  for (const envPath of candidates) {
    try {
      const raw = readFileSync(envPath, "utf8");
      for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("BACKEND_URL=")) {
          continue;
        }
        const value = trimmed.slice("BACKEND_URL=".length).trim();
        if (value) {
          return value.replace(/\/$/, "");
        }
      }
    } catch {
      // Try the next location. BACKEND_URL can also come from the process environment.
    }
  }

  throw new Error("BACKEND_URL lipseste din backend/.env");
}

const backendUrl = resolveBackendUrl();

function resolveBrowserApiBase(serverUrl: string): string {
  const override = process.env.NUXT_PUBLIC_API_BASE?.trim();
  if (override) {
    return override.replace(/\/$/, "");
  }
  // Local pages and the local API are the same site, so the session cookie is sent.
  // BACKEND_URL can stay on a public tunnel for payment notifications.
  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:4000";
  }
  return serverUrl;
}

const securityHeaders: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy": [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "script-src 'self' 'unsafe-inline' https://cdn.sameday.ro",
    "style-src 'self' 'unsafe-inline' https://cdn.sameday.ro",
    "frame-src https://cdn.sameday.ro https://*.sameday.ro",
    "img-src 'self' data: blob: https: http://localhost:4000",
    "font-src 'self' data:",
    "connect-src 'self' http://localhost:4000 https:",
  ].join("; "),
};

if (process.env.NODE_ENV === "production") {
  securityHeaders["Strict-Transport-Security"] =
    "max-age=15552000; includeSubDomains";
}

export default defineNuxtConfig({
  ssr: true,
  sourcemap:
    process.env.NODE_ENV === "production"
      ? { server: false, client: false }
      : { server: true, client: true },

  nitro: {
    preset: "netlify",
    routeRules: {
      "/**": { headers: securityHeaders },
    },
  },

  routeRules: {
    "/**": { headers: securityHeaders },
    "/cos": { ssr: false, headers: securityHeaders },
    "/en/cart": { ssr: false, headers: securityHeaders },
    "/auth/**": { ssr: false, headers: securityHeaders },
    "/en/auth/**": { ssr: false, headers: securityHeaders },
    "/vinde-cu-noi": { ssr: false, headers: securityHeaders },
    "/en/sell-with-us": { ssr: false, headers: securityHeaders },
    "/login": { ssr: false, headers: securityHeaders },
    "/en/login": { ssr: false, headers: securityHeaders },
    "/admin/**": { ssr: false, headers: securityHeaders },
    "/en/admin/**": { ssr: false, headers: securityHeaders },
    "/profil/comenzi/**": { ssr: false, headers: securityHeaders },
    "/en/profile/orders/**": { ssr: false, headers: securityHeaders },
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
  css: [
    "@phosphor-icons/web/regular",
    "@phosphor-icons/web/fill",
    "~/assets/scss/index.scss",
    "~/assets/css/main.css",
  ],

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
      apiBase: resolveBrowserApiBase(backendUrl),
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
