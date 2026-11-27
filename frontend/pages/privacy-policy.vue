<template>
  <LegalDocumentPage
    :breadcrumb-current="t('breadcrumb.privacy')"
    :title="t('title')"
    :last-updated="t('lastUpdated')"
    :sections="sections"
  />
</template>

<script setup lang="ts">
import type { LegalSection } from "~/components/LegalDocumentPage.vue";

defineI18nRoute({
  paths: {
    ro: "/prelucrarea-datelor",
    en: "/privacy-policy",
  },
});

const { t, locale } = useI18n({ useScope: "local" });

const roSections: LegalSection[] = [
  {
    id: "general",
    title: "1. Introducere",
    paragraphs: [
      "Prezenta politică descrie modul în care Mâini în lut prelucrează datele cu caracter personal ale vizitatorilor și clienților website-ului nostru, în conformitate cu Regulamentul (UE) 2016/679 (GDPR) și legislația națională aplicabilă.",
      "Prin utilizarea website-ului și plasarea comenzilor, confirmi că ai citit această politică.",
    ],
  },
  {
    id: "operator",
    title: "2. Operatorul de date",
    paragraphs: [
      "Operatorul datelor cu caracter personal este MAINI IN LUT SRL (CUI 54003138, Reg. Com. J2026011298005), cu sediul în Sibiu, str. Țiglări, bl. A5, ap. 42.",
      "Pentru întrebări legate de protecția datelor, ne poți contacta la maini.in.lut@gmail.com.",
    ],
  },
  {
    id: "data-collected",
    title: "3. Ce date colectăm",
    paragraphs: [
      "Colectăm date pe care ni le furnizezi direct: nume, prenume, adresă de email, număr de telefon, adresă de livrare și facturare, detalii despre comenzi.",
      "În cazul în care îți creezi un cont, stocăm și datele de autentificare (email și parolă criptată) sau identificatorul asociat autentificării prin servicii terțe (ex. Google), dacă alegi această opțiune.",
      "Putem colecta automat date tehnice limitate, precum adresa IP, tipul browserului sau informații despre dispozitiv, în scopuri de securitate și funcționare a site-ului.",
    ],
  },
  {
    id: "purposes",
    title: "4. Scopurile prelucrării",
    paragraphs: [
      "Datele sunt prelucrate pentru: procesarea și livrarea comenzilor, comunicarea legată de comenzi, gestionarea contului de utilizator, procesarea plăților, respectarea obligațiilor legale și îmbunătățirea serviciilor noastre.",
      "Nu folosim datele tale în scopuri de marketing fără consimțământul tău explicit.",
    ],
  },
  {
    id: "legal-basis",
    title: "5. Temeiul legal",
    paragraphs: [
      "Prelucrăm datele în baza executării contractului (comanda ta), a obligațiilor legale (facturare, contabilitate), a interesului legitim (securitate, prevenirea fraudelor) și, unde este cazul, a consimțământului tău.",
    ],
  },
  {
    id: "recipients",
    title: "6. Cui transmitem datele",
    paragraphs: [
      "Datele pot fi partajate cu furnizori care ne ajută să operăm magazinul: procesatori de plăți (ex. Netopia), servicii de curierat, furnizori de hosting și email.",
      "Acești furnizori prelucrează datele doar în numele nostru și conform instrucțiunilor noastre. Nu vindem datele tale către terți.",
    ],
  },
  {
    id: "retention",
    title: "7. Perioada de stocare",
    paragraphs: [
      "Păstrăm datele atât timp cât este necesar pentru îndeplinirea scopurilor menționate sau conform termenelor legale (de exemplu, documente contabile).",
      "După expirarea termenelor aplicabile, datele sunt șterse sau anonimizate.",
    ],
  },
  {
    id: "rights",
    title: "8. Drepturile tale",
    paragraphs: [
      "Ai dreptul de acces, rectificare, ștergere, restricționare a prelucrării, portabilitate a datelor și de a te opune anumitor prelucrări, în condițiile legii.",
      "Poți retrage consimțământul acordat în orice moment, fără a afecta legalitatea prelucrării anterioare.",
      "Ai dreptul de a depune o plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP).",
    ],
  },
  {
    id: "security",
    title: "9. Securitatea datelor",
    paragraphs: [
      "Aplicăm măsuri tehnice și organizatorice rezonabile pentru protejarea datelor împotriva accesului neautorizat, pierderii sau alterării.",
    ],
  },
  {
    id: "updates",
    title: "10. Actualizări",
    paragraphs: [
      "Putem actualiza această politică periodic. Versiunea curentă este publicată pe această pagină, cu data ultimei actualizări.",
    ],
  },
];

const enSections: LegalSection[] = [
  {
    id: "general",
    title: "1. Introduction",
    paragraphs: [
      "This policy describes how Mâini în lut processes the personal data of visitors and customers of our website, in accordance with Regulation (EU) 2016/679 (GDPR) and applicable national law.",
      "By using the website and placing orders, you confirm that you have read this policy.",
    ],
  },
  {
    id: "operator",
    title: "2. Data controller",
    paragraphs: [
      "The data controller is MAINI IN LUT SRL (VAT ID 54003138, Trade Register J2026011298005), registered address: Sibiu, Țiglări St., bl. A5, apt. 42, postal code 550099.",
      "For data protection enquiries, contact us at maini.in.lut@gmail.com.",
    ],
  },
  {
    id: "data-collected",
    title: "3. Data we collect",
    paragraphs: [
      "We collect data you provide directly: first name, last name, email address, phone number, delivery and billing address, and order details.",
      "If you create an account, we also store authentication data (email and hashed password) or the identifier linked to third-party sign-in (e.g. Google), if you choose that option.",
      "We may automatically collect limited technical data such as IP address, browser type, or device information for security and site operation.",
    ],
  },
  {
    id: "purposes",
    title: "4. Purposes of processing",
    paragraphs: [
      "Data is processed to: process and deliver orders, communicate about orders, manage user accounts, process payments, comply with legal obligations, and improve our services.",
      "We do not use your data for marketing without your explicit consent.",
    ],
  },
  {
    id: "legal-basis",
    title: "5. Legal basis",
    paragraphs: [
      "We process data based on contract performance (your order), legal obligations (invoicing, accounting), legitimate interest (security, fraud prevention), and, where applicable, your consent.",
    ],
  },
  {
    id: "recipients",
    title: "6. Data recipients",
    paragraphs: [
      "Data may be shared with providers that help us operate the store: payment processors (e.g. Netopia), courier services, hosting and email providers.",
      "These providers process data only on our behalf and according to our instructions. We do not sell your data to third parties.",
    ],
  },
  {
    id: "retention",
    title: "7. Retention period",
    paragraphs: [
      "We retain data for as long as necessary to fulfil the stated purposes or as required by law (e.g. accounting records).",
      "After applicable periods expire, data is deleted or anonymised.",
    ],
  },
  {
    id: "rights",
    title: "8. Your rights",
    paragraphs: [
      "You have the right of access, rectification, erasure, restriction of processing, data portability, and to object to certain processing, as provided by law.",
      "You may withdraw consent at any time without affecting the lawfulness of prior processing.",
      "You have the right to lodge a complaint with your national data protection authority.",
    ],
  },
  {
    id: "security",
    title: "9. Data security",
    paragraphs: [
      "We apply reasonable technical and organisational measures to protect data against unauthorised access, loss, or alteration.",
    ],
  },
  {
    id: "updates",
    title: "10. Updates",
    paragraphs: [
      "We may update this policy periodically. The current version is published on this page with the last updated date.",
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
    "metaTitle": "Prelucrarea datelor cu caracter personal | Mâini în lut",
    "breadcrumb": {
      "privacy": "Prelucrarea datelor"
    },
    "title": "Prelucrarea datelor cu caracter personal",
    "lastUpdated": "Ultima actualizare: mai 2026"
  },
  "en": {
    "metaTitle": "Privacy Policy | Mâini în lut",
    "breadcrumb": {
      "privacy": "Privacy Policy"
    },
    "title": "Privacy Policy",
    "lastUpdated": "Last updated: May 2026"
  }
}
</i18n>
