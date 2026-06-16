<template>
  <div class="maini-ui__section md:px-4">
    <div class="maini-ui__container-products py-10 md:py-14 max-w-3xl mx-auto">
      <nav
        class="flex mb-6 text-sm h-color-dusty-gray"
        aria-label="Breadcrumb"
      >
        <ol class="flex flex-wrap items-center gap-1">
          <li>
            <NuxtLink :to="$localePath('/')" class="hover:h-color-primary">
              {{ t("breadcrumb.home") }}
            </NuxtLink>
          </li>
          <li><span class="mx-1">/</span></li>
          <li>
            <span class="h-color-lunar-green font-medium">{{
              t("breadcrumb.terms")
            }}</span>
          </li>
        </ol>
      </nav>

      <h1 class="text-3xl md:text-4xl font-bold h-color-lunar-green mb-2">
        {{ t("title") }}
      </h1>
      <p class="text-sm text-gray-500 mb-8">{{ t("lastUpdated") }}</p>

      <div class="space-y-8 text-gray-700 leading-relaxed">
        <section v-for="section in sections" :key="section.title">
          <h2 class="text-xl font-semibold h-color-lunar-green mb-3">
            {{ section.title }}
          </h2>
          <p
            v-for="(paragraph, index) in section.paragraphs"
            :key="index"
            class="mb-3 last:mb-0"
          >
            {{ paragraph }}
          </p>
        </section>
      </div>

      <div class="mt-10 pt-6 border-t border-gray-200">
        <NuxtLink
          :to="backToHref"
          class="inline-flex items-center gap-2 text-sm font-medium h-color-palm-leaf hover:h-color-primary underline"
        >
          <i class="ph ph-arrow-left"></i>
          {{ t("backToCheckout") }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineI18nRoute({
  paths: {
    ro: "/termeni-si-conditii",
    en: "/terms-and-conditions",
  },
});

const { t, locale } = useI18n({ useScope: "local" });
const route = useRoute();
const localePath = useLocalePath();

const backToHref = computed(() => {
  if (route.query.step === "3") {
    return localePath({ name: "cos", query: { step: "3" } });
  }
  return localePath({ name: "cos" });
});

type TermsSection = {
  title: string;
  paragraphs: string[];
};

// NOTE: In this project, using i18n for nested objects/arrays may return the
// internal compiled message format, which renders as JSON in the UI.
// Keep legal text as plain strings directly here.
const roSections: TermsSection[] = [
  {
    title: "1. Dispozitii generale",
    paragraphs: [
      "Prezentii Termeni si Conditii reglementeaza utilizarea magazinului online Maini in lut si achizitionarea produselor oferite prin acest website.",
      "Prin plasarea unei comenzi, confirmi ca ai citit, inteles si acceptat in totalitate acesti termeni.",
    ],
  },
  {
    title: "2. Produse si comenzi",
    paragraphs: [
      "Produsele sunt realizate manual din ceramica. Variatiile minore de culoare, forma sau textura sunt naturale si nu sunt considerate defecte.",
      "O comanda este confirmata dupa primirea solicitarii tale si, dupa caz, dupa procesarea cu succes a platii.",
      "Ne rezervam dreptul de a anula o comanda daca produsul nu mai este disponibil sau daca a fost afisat un pret eronat din cauza unei erori tehnice.",
    ],
  },
  {
    title: "3. Preturi si plata",
    paragraphs: [
      "Toate preturile sunt afisate in lei (RON) si includ TVA, acolo unde este cazul.",
      "Plata se poate face online cu cardul prin procesatorul de plati sau ramburs la livrare, acolo unde aceasta optiune este disponibila.",
      "Taxele suplimentare, precum livrarea sau taxa operationala pentru plata ramburs, sunt afisate clar inainte de confirmarea comenzii.",
    ],
  },
  {
    title: "4. Livrare",
    paragraphs: [
      "Comenzile sunt livrate la adresa furnizata in timpul checkout-ului. Te rugam sa te asiguri ca datele de livrare sunt complete si corecte.",
      "Termenele estimate de livrare pot varia in functie de locatie si disponibilitatea curierului. Intarzierile cauzate de factori in afara controlului nostru nu dau dreptul la despagubiri.",
    ],
  },
  {
    title: "5. Retururi si reclamatii",
    paragraphs: [
      "Conform legislatiei privind protectia consumatorilor, poti returna produsele in termen de 14 zile calendaristice de la primire, cu conditia sa fie nefolosite si in ambalajul original.",
      "Pentru produse defecte sau deteriorate in transport, te rugam sa ne contactezi in maxim 48 de ore de la livrare, cu fotografii si detaliile comenzii.",
      "Termenele de rambursare depind de metoda de plata initiala si pot dura cateva zile lucratoare dupa acceptarea returului.",
    ],
  },
  {
    title: "6. Date personale",
    paragraphs: [
      "Datele personale colectate la finalizarea comenzii sunt folosite exclusiv pentru procesarea comenzilor, livrarea produselor si comunicarea legata de achizitie.",
      "Nu vindem date personale catre terti. Datele pot fi partajate doar cu furnizori necesari pentru plata, livrare sau conformitate legala.",
    ],
  },
  {
    title: "7. Contact",
    paragraphs: [
      "Pentru intrebari despre comenzi, retururi sau acesti termeni, ne poti contacta prin pagina de Contact sau la adresa de email afisata pe website.",
    ],
  },
];

const enSections: TermsSection[] = [
  {
    title: "1. General provisions",
    paragraphs: [
      "These Terms and Conditions govern the use of the Maini in lut online store and the purchase of products offered through this website.",
      "By placing an order, you confirm that you have read, understood, and accepted these terms in full.",
    ],
  },
  {
    title: "2. Products and orders",
    paragraphs: [
      "Products are handmade ceramic items. Minor variations in color, shape, or texture are natural and are not considered defects.",
      "An order is confirmed after we receive your request and, where applicable, after payment is successfully processed.",
      "We reserve the right to cancel an order if a product is no longer available or if incorrect pricing was displayed due to a technical error.",
    ],
  },
  {
    title: "3. Prices and payment",
    paragraphs: [
      "All prices are displayed in Romanian lei (RON) and include VAT where applicable.",
      "Payment can be made online by card through our payment processor or cash on delivery, where this option is available.",
      "Additional fees such as delivery or cash-on-delivery operational fees are shown clearly before order confirmation.",
    ],
  },
  {
    title: "4. Delivery",
    paragraphs: [
      "Orders are delivered to the address provided during checkout. Please ensure that delivery details are complete and accurate.",
      "Estimated delivery times may vary depending on location and courier availability. Delays caused by factors outside our control do not entitle the customer to compensation.",
    ],
  },
  {
    title: "5. Returns and complaints",
    paragraphs: [
      "In accordance with applicable consumer protection legislation, you may return products within 14 calendar days of receiving them, provided they are unused and in their original packaging.",
      "For defective products or shipping damage, please contact us within 48 hours of delivery with photos and order details.",
      "Refund processing times depend on the original payment method and may take several business days after the return is accepted.",
    ],
  },
  {
    title: "6. Personal data",
    paragraphs: [
      "Personal data collected during checkout is used exclusively to process orders, deliver products, and communicate about your purchase.",
      "We do not sell personal data to third parties. Data may be shared only with service providers necessary for payment, delivery, or legal compliance.",
    ],
  },
  {
    title: "7. Contact",
    paragraphs: [
      "For questions about orders, returns, or these terms, you can contact us through the Contact page or at the email address listed on the website.",
    ],
  },
];

const sections = computed(() => {
  return locale.value === "en" ? enSections : roSections;
});

useHead({
  title: () => t("metaTitle"),
});
</script>

<i18n lang="json">
{
  "en": {
    "metaTitle": "Terms and Conditions | Maini in lut",
    "breadcrumb": {
      "home": "Home",
      "terms": "Terms and Conditions"
    },
    "title": "Terms and Conditions",
    "lastUpdated": "Last updated: May 2026",
    "backToCheckout": "Back to checkout",
    "sections": [
      {
        "title": "1. General provisions",
        "paragraphs": [
          "These Terms and Conditions govern the use of the Maini in lut online store and the purchase of products offered through this website.",
          "By placing an order, you confirm that you have read, understood, and accepted these terms in full."
        ]
      },
      {
        "title": "2. Products and orders",
        "paragraphs": [
          "Products are handmade ceramic items. Minor variations in color, shape, or texture are natural and are not considered defects.",
          "An order is confirmed after we receive your request and, where applicable, after payment is successfully processed.",
          "We reserve the right to cancel an order if a product is no longer available or if incorrect pricing was displayed due to a technical error."
        ]
      },
      {
        "title": "3. Prices and payment",
        "paragraphs": [
          "All prices are displayed in Romanian lei (RON) and include VAT where applicable.",
          "Payment can be made online by card through our payment processor or cash on delivery, where this option is available.",
          "Additional fees such as delivery or cash-on-delivery operational fees are shown clearly before order confirmation."
        ]
      },
      {
        "title": "4. Delivery",
        "paragraphs": [
          "Orders are delivered to the address provided during checkout. Please ensure that delivery details are complete and accurate.",
          "Estimated delivery times may vary depending on location and courier availability. Delays caused by factors outside our control do not entitle the customer to compensation."
        ]
      },
      {
        "title": "5. Returns and complaints",
        "paragraphs": [
          "In accordance with applicable consumer protection legislation, you may return products within 14 calendar days of receiving them, provided they are unused and in their original packaging.",
          "For defective products or shipping damage, please contact us within 48 hours of delivery with photos and order details.",
          "Refund processing times depend on the original payment method and may take several business days after the return is accepted."
        ]
      },
      {
        "title": "6. Personal data",
        "paragraphs": [
          "Personal data collected during checkout is used exclusively to process orders, deliver products, and communicate about your purchase.",
          "We do not sell personal data to third parties. Data may be shared only with service providers necessary for payment, delivery, or legal compliance."
        ]
      },
      {
        "title": "7. Contact",
        "paragraphs": [
          "For questions about orders, returns, or these terms, you can contact us through the Contact page or at the email address listed on the website."
        ]
      }
    ]
  },
  "ro": {
    "metaTitle": "Termeni si conditii | Maini in lut",
    "breadcrumb": {
      "home": "Acasa",
      "terms": "Termeni si conditii"
    },
    "title": "Termeni si conditii",
    "lastUpdated": "Ultima actualizare: mai 2026",
    "backToCheckout": "Inapoi la finalizarea comenzii",
    "sections": [
      {
        "title": "1. Dispozitii generale",
        "paragraphs": [
          "Prezentii Termeni si Conditii reglementeaza utilizarea magazinului online Maini in lut si achizitionarea produselor oferite prin acest website.",
          "Prin plasarea unei comenzi, confirmi ca ai citit, inteles si acceptat in totalitate acesti termeni."
        ]
      },
      {
        "title": "2. Produse si comenzi",
        "paragraphs": [
          "Produsele sunt realizate manual din ceramica. Variatiile minore de culoare, forma sau textura sunt naturale si nu sunt considerate defecte.",
          "O comanda este confirmata dupa primirea solicitarii tale si, dupa caz, dupa procesarea cu succes a platii.",
          "Ne rezervam dreptul de a anula o comanda daca produsul nu mai este disponibil sau daca a fost afisat un pret eronat din cauza unei erori tehnice."
        ]
      },
      {
        "title": "3. Preturi si plata",
        "paragraphs": [
          "Toate preturile sunt afisate in lei (RON) si includ TVA, acolo unde este cazul.",
          "Plata se poate face online cu cardul prin procesatorul de plati sau ramburs la livrare, acolo unde aceasta optiune este disponibila.",
          "Taxele suplimentare, precum livrarea sau taxa operationala pentru plata ramburs, sunt afisate clar inainte de confirmarea comenzii."
        ]
      },
      {
        "title": "4. Livrare",
        "paragraphs": [
          "Comenzile sunt livrate la adresa furnizata in timpul checkout-ului. Te rugam sa te asiguri ca datele de livrare sunt complete si corecte.",
          "Termenele estimate de livrare pot varia in functie de locatie si disponibilitatea curierului. Intarzierile cauzate de factori in afara controlului nostru nu dau dreptul la despagubiri."
        ]
      },
      {
        "title": "5. Retururi si reclamatii",
        "paragraphs": [
          "Conform legislatiei privind protectia consumatorilor, poti returna produsele in termen de 14 zile calendaristice de la primire, cu conditia sa fie nefolosite si in ambalajul original.",
          "Pentru produse defecte sau deteriorate in transport, te rugam sa ne contactezi in maxim 48 de ore de la livrare, cu fotografii si detaliile comenzii.",
          "Termenele de rambursare depind de metoda de plata initiala si pot dura cateva zile lucratoare dupa acceptarea returului."
        ]
      },
      {
        "title": "6. Date personale",
        "paragraphs": [
          "Datele personale colectate la finalizarea comenzii sunt folosite exclusiv pentru procesarea comenzilor, livrarea produselor si comunicarea legata de achizitie.",
          "Nu vindem date personale catre terti. Datele pot fi partajate doar cu furnizori necesari pentru plata, livrare sau conformitate legala."
        ]
      },
      {
        "title": "7. Contact",
        "paragraphs": [
          "Pentru intrebari despre comenzi, retururi sau acesti termeni, ne poti contacta prin pagina de Contact sau la adresa de email afisata pe website."
        ]
      }
    ]
  }
}
</i18n>
