<template>
  <LegalDocumentPage
    :breadcrumb-current="t('breadcrumb.cookies')"
    :title="t('title')"
    :last-updated="t('lastUpdated')"
    :sections="sections"
  />
</template>

<script setup lang="ts">
import type { LegalSection } from "~/components/LegalDocumentPage.vue";

defineI18nRoute({
  paths: {
    ro: "/politica-cookie",
    en: "/cookie-policy",
  },
});

const { t, locale } = useI18n({ useScope: "local" });

const roSections: LegalSection[] = [
  {
    id: "what",
    title: "1. Ce sunt cookie-urile",
    paragraphs: [
      "Cookie-urile sunt fișiere text de mici dimensiuni stocate pe dispozitivul tău atunci când vizitezi un website. Ele ajută site-ul să funcționeze corect și pot reține anumite preferințe.",
    ],
  },
  {
    id: "how-we-use",
    title: "2. Cum folosim cookie-urile",
    paragraphs: [
      "Website-ul Mâini în lut poate folosi cookie-uri strict necesare pentru funcționarea magazinului online: autentificare, coș de cumpărături, preferințe de limbă și securitate.",
      "Aceste cookie-uri sunt esențiale și nu necesită consimțământul tău prealabil.",
    ],
  },
  {
    id: "types",
    title: "3. Tipuri de cookie-uri",
    paragraphs: [
      "Cookie-uri necesare: permit navigarea și utilizarea funcțiilor de bază (ex. menținerea sesiunii, coșul de cumpărături).",
      "Cookie-uri funcționale: rețin alegeri precum limba site-ului.",
      "Cookie-uri de la terți: anumite servicii integrate (ex. autentificare Google, procesator de plăți) pot seta propriile cookie-uri, conform politicilor lor.",
    ],
  },
  {
    id: "third-party",
    title: "4. Cookie-uri ale terților",
    paragraphs: [
      "Dacă folosești autentificarea prin Google sau finalizezi plata prin Netopia, acești furnizori pot plasa cookie-uri proprii. Te încurajăm să consulți politicile lor de confidențialitate pentru detalii.",
    ],
  },
  {
    id: "manage",
    title: "5. Cum poți controla cookie-urile",
    paragraphs: [
      "Poți configura browserul să refuze cookie-uri sau să te anunțe când sunt trimise. Reține că dezactivarea cookie-urilor necesare poate afecta funcționarea magazinului (ex. coș, autentificare).",
      "Majoritatea browserelor oferă setări în secțiunea de confidențialitate sau securitate.",
    ],
  },
  {
    id: "duration",
    title: "6. Durata cookie-urilor",
    paragraphs: [
      "Cookie-urile de sesiune sunt șterse la închiderea browserului. Cookie-urile persistente rămân pe dispozitiv pentru o perioadă limitată, în funcție de scopul lor.",
    ],
  },
  {
    id: "updates",
    title: "7. Actualizări",
    paragraphs: [
      "Putem actualiza această politică pentru a reflecta modificări tehnice sau legale. Versiunea curentă este disponibilă pe această pagină.",
      "Pentru întrebări despre cookie-uri sau date personale, contactează-ne la maini.in.lut@gmail.com sau prin pagina de Contact.",
    ],
  },
];

const enSections: LegalSection[] = [
  {
    id: "what",
    title: "1. What are cookies",
    paragraphs: [
      "Cookies are small text files stored on your device when you visit a website. They help the site work properly and may remember certain preferences.",
    ],
  },
  {
    id: "how-we-use",
    title: "2. How we use cookies",
    paragraphs: [
      "The Mâini în lut website may use strictly necessary cookies for the online store to function: authentication, shopping cart, language preferences, and security.",
      "These cookies are essential and do not require your prior consent.",
    ],
  },
  {
    id: "types",
    title: "3. Types of cookies",
    paragraphs: [
      "Necessary cookies: enable navigation and core features (e.g. session maintenance, shopping cart).",
      "Functional cookies: remember choices such as site language.",
      "Third-party cookies: some integrated services (e.g. Google sign-in, payment processor) may set their own cookies under their policies.",
    ],
  },
  {
    id: "third-party",
    title: "4. Third-party cookies",
    paragraphs: [
      "If you use Google sign-in or pay through Netopia, those providers may place their own cookies. We encourage you to review their privacy policies for details.",
    ],
  },
  {
    id: "manage",
    title: "5. How to control cookies",
    paragraphs: [
      "You can configure your browser to refuse cookies or alert you when they are sent. Note that disabling necessary cookies may affect store functionality (e.g. cart, login).",
      "Most browsers offer settings in the privacy or security section.",
    ],
  },
  {
    id: "duration",
    title: "6. Cookie duration",
    paragraphs: [
      "Session cookies are deleted when you close your browser. Persistent cookies remain on your device for a limited period depending on their purpose.",
    ],
  },
  {
    id: "updates",
    title: "7. Updates",
    paragraphs: [
      "We may update this policy to reflect technical or legal changes. The current version is available on this page.",
      "For questions about cookies or personal data, contact us at maini.in.lut@gmail.com or via the Contact page.",
    ],
  },
];

const sections = computed(() =>
  locale.value === "en" ? enSections : roSections,
);

useHead({
  title: () => t("metaTitle"),
});
</script>

<i18n lang="json">
{
  "ro": {
    "metaTitle": "Politica de utilizare Cookie-uri | Mâini în lut",
    "breadcrumb": {
      "cookies": "Politica Cookie-uri"
    },
    "title": "Politica de utilizare Cookie-uri",
    "lastUpdated": "Ultima actualizare: mai 2026"
  },
  "en": {
    "metaTitle": "Cookie Policy | Mâini în lut",
    "breadcrumb": {
      "cookies": "Cookie Policy"
    },
    "title": "Cookie Policy",
    "lastUpdated": "Last updated: May 2026"
  }
}
</i18n>
