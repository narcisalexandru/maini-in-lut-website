<template>
  <footer class="site-footer h-bg-primary h-color-secondary">
    <div class="maini-ui__container site-footer__main">
      <div class="site-footer__grid">
        <div class="site-footer__brand">
          <NuxtLink :to="$localePath('/')" class="site-footer__brand-link">
            <span class="site-footer__brand-name">{{ COMPANY.brandName }}</span>
          </NuxtLink>
          <p class="site-footer__tagline site-footer__tagline--full">
            {{ t("tagline") }}
          </p>
          <p class="site-footer__tagline site-footer__tagline--short">
            {{ t("taglineShort") }}
          </p>
          <div class="site-footer__social">
            <a
              v-for="social in socialLinks"
              :key="social.label"
              :href="social.href"
              :aria-label="social.label"
              class="site-footer__social-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i :class="['ph', social.icon]" aria-hidden="true"></i>
            </a>
          </div>
        </div>

        <div class="site-footer__secondary">
          <div class="site-footer__column">
            <h2 class="site-footer__heading">{{ t("infoHeading") }}</h2>
            <ul class="site-footer__links">
              <li v-for="link in infoLinks" :key="link.labelKey">
                <NuxtLink
                  :to="$localePath({ name: link.name })"
                  class="site-footer__link"
                >
                  {{ t(link.labelKey) }}
                </NuxtLink>
              </li>
            </ul>
          </div>

          <div class="site-footer__column">
            <h2 class="site-footer__heading">{{ t("workshopHeading") }}</h2>
            <ul class="site-footer__contact">
              <li>
                <i class="ph ph-buildings" aria-hidden="true"></i>
                <span>{{ COMPANY.legalName }}</span>
              </li>
              <li>
                <i class="ph ph-identification-card" aria-hidden="true"></i>
                <span>{{
                  t("companyIds", {
                    cui: COMPANY.cui,
                    tradeRegister: COMPANY.tradeRegister,
                  })
                }}</span>
              </li>
              <li>
                <i class="ph ph-map-pin" aria-hidden="true"></i>
                <span>{{ companyAddress }}</span>
              </li>
              <li>
                <i class="ph ph-envelope-simple" aria-hidden="true"></i>
                <a :href="`mailto:${COMPANY.email}`" class="site-footer__link">
                  {{ COMPANY.email }}
                </a>
              </li>
              <li>
                <i class="ph ph-phone" aria-hidden="true"></i>
                <a :href="`tel:${COMPANY.phoneTel}`" class="site-footer__link">
                  {{ COMPANY.phone }}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div class="site-footer__badges">
      <ClientOnly>
        <div
          ref="netopiaBadgeRef"
          class="site-footer__netopia-badge"
          :aria-label="t('netopiaPayments')"
        />
      </ClientOnly>

      <a
        :href="anpcSalBadge.href"
        class="site-footer__badge-link site-footer__badge-link--anpc"
        target="_blank"
        rel="noopener noreferrer"
        :aria-label="t(anpcSalBadge.labelKey)"
      >
        <img
          :src="anpcSalBadge.src"
          :alt="t(anpcSalBadge.labelKey)"
          width="140"
          height="28"
          loading="lazy"
        />
      </a>
    </div>

    <div class="site-footer__bottom">
      <p class="site-footer__copyright">
        {{ t("copyright", { year: currentYear, company: COMPANY.legalName }) }}
      </p>
    </div>
  </footer>
</template>

<script setup>
import {
  COMPANY,
  COMPANY_ADDRESS_RO,
  COMPANY_ADDRESS_EN,
} from "~/constants/company";

const { t, locale } = useI18n({
  useScope: "local",
});

const currentYear = new Date().getFullYear();

const companyAddress = computed(() =>
  locale.value === "en" ? COMPANY_ADDRESS_EN : COMPANY_ADDRESS_RO,
);

const infoLinks = [
  { labelKey: "deliveryReturns", name: "terms-and-conditions" },
  { labelKey: "ceramicCare", name: "blog" },
  { labelKey: "terms", name: "terms-and-conditions" },
  { labelKey: "privacy", name: "privacy-policy" },
  { labelKey: "cookies", name: "cookie-policy" },
  { labelKey: "contact", name: "contact" },
];

const socialLinks = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/maini.in.lut",
    icon: "ph-instagram-logo",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61576573445657",
    icon: "ph-facebook-logo",
  },
];

const anpcSalBadge = {
  href: "https://reclamatiisal.anpc.ro",
  src: "/images/footer/anpc-sal.svg",
  labelKey: "anpcSal",
};

const NETOPIA_CONTRAST_COLOR = "#8a9772";
const NETOPIA_BADGE_WIDTH = 140;
const NETOPIA_BADGE_HEIGHT = 28;

const netopiaBadgeRef = ref(null);

function rgbColor(color) {
  let r;
  let g;
  let b;
  if (color?.match(/^rgb/)) {
    const match = color.match(
      /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/,
    );
    r = Number(match[1]);
    g = Number(match[2]);
    b = Number(match[3]);
  } else {
    const hex = +(
      "0x" + color.slice(1).replace(color.length < 5 && /./g, "$&$&")
    );
    r = hex >> 16;
    g = (hex >> 8) & 255;
    b = hex & 255;
  }
  const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));
  return { rgb: [r, g, b], hsp };
}

function colorDistance(color1, color2) {
  const [r1, g1, b1] = rgbColor(color1).rgb;
  const [r2, g2, b2] = rgbColor(color2).rgb;
  const d = Math.sqrt(
    (r2 - r1) ** 2 + (g2 - g1) ** 2 + (b2 - b1) ** 2,
  );
  return d / Math.sqrt(255 ** 2 * 3);
}

function renderNetopiaBadge(container) {
  if (!container || container.dataset.netopiaRendered === "true") return;

  const version = "horizontal";
  const bgColor = NETOPIA_CONTRAST_COLOR;

  const wrapper = document.createElement("div");
  wrapper.style.width = "100%";
  wrapper.style.height = "100%";
  wrapper.style.maxWidth = `${NETOPIA_BADGE_WIDTH}px`;
  wrapper.style.maxHeight = `${NETOPIA_BADGE_HEIGHT}px`;

  const img = document.createElement("img");
  img.style.cssText = "width:100%;height:100%;cursor:pointer;display:block";
  img.setAttribute("title", "NETOPIA Payments");
  img.setAttribute("alt", "NETOPIA Payments");
  img.addEventListener("click", () => {
    window.open("https://netopia-payments.com/", "_blank", "noopener,noreferrer");
  });

  const needsBackdrop =
    colorDistance(bgColor, "#EB001B") < 0.25 ||
    colorDistance(bgColor, "#F79E1B") < 0.25;
  const isLightBackground = rgbColor(bgColor).hsp > 166;
  const logoColor = isLightBackground ? "black" : "white";

  wrapper.style.backgroundColor = needsBackdrop
    ? isLightBackground
      ? "#ffffff80"
      : "#00000080"
    : "transparent";
  img.src = `https://mny.ro/np-${logoColor}-0.svg`;

  wrapper.appendChild(img);
  container.replaceChildren(wrapper);
  container.dataset.netopiaRendered = "true";
}

onMounted(() => {
  if (netopiaBadgeRef.value) renderNetopiaBadge(netopiaBadgeRef.value);
});

watch(netopiaBadgeRef, (container) => {
  if (container) renderNetopiaBadge(container);
});
</script>

<style scoped lang="scss">
@use "~/assets/scss/_variables.scss" as *;
@use "~/assets/scss/_functions.scss" as *;

.site-footer {
  &__main {
    padding-top: rem(32px);
    padding-bottom: rem(28px);

    @media screen and (max-width: 767px) {
      padding-top: rem(20px);
      padding-bottom: rem(18px);
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: rem(28px);

    @media screen and (max-width: 767px) {
      gap: rem(20px);
    }

    @media screen and (min-width: 768px) {
      grid-template-columns: 1.4fr 1fr 1fr;
      gap: rem(24px);
    }
  }

  &__secondary {
    @media screen and (max-width: 767px) {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: rem(16px) rem(12px);
      align-items: start;
    }

    @media screen and (min-width: 768px) {
      display: contents;
    }
  }

  &__column {
    min-width: 0;
  }

  &__brand {
    max-width: rem(360px);

    @media screen and (max-width: 767px) {
      max-width: none;
      text-align: center;
    }
  }

  &__brand-link {
    display: inline-block;
    color: inherit;
    text-decoration: none;
    margin-bottom: rem(10px);

    @media screen and (max-width: 767px) {
      margin-bottom: rem(8px);
    }
  }

  &__brand-name {
    font-size: rem(20px);
    font-weight: 700;
    letter-spacing: 0.02em;
    color: $color-secondary;
  }

  &__tagline {
    font-size: rem(14px);
    line-height: 1.55;
    margin: 0 0 rem(16px);
    opacity: 0.92;

    &--full {
      @media screen and (max-width: 767px) {
        display: none;
      }
    }

    &--short {
      display: none;
      font-size: rem(13px);
      line-height: 1.45;
      margin-bottom: rem(12px);

      @media screen and (max-width: 767px) {
        display: block;
      }
    }
  }

  &__social {
    display: flex;
    gap: rem(10px);

    @media screen and (max-width: 767px) {
      justify-content: center;
    }
  }

  &__social-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: rem(36px);
    height: rem(36px);
    border-radius: 50%;
    background-color: rgba($color-secondary, 0.14);
    color: $color-secondary;
    text-decoration: none;
    transition:
      background-color 0.2s ease,
      transform 0.2s ease;

    i {
      font-size: rem(16px);
    }

    &:hover {
      background-color: rgba($color-secondary, 0.24);
      transform: translateY(-1px);
    }
  }

  &__heading {
    font-size: rem(16px);
    font-weight: 700;
    margin: 0 0 rem(12px);
    color: inherit;

    @media screen and (max-width: 767px) {
      font-size: rem(15px);
      margin-bottom: rem(8px);
    }
  }

  &__links {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: rem(8px);

    @media screen and (max-width: 767px) {
      gap: rem(6px);
    }
  }

  &__link {
    color: inherit;
    text-decoration: none;
    font-size: rem(14px);
    opacity: 0.92;
    transition: opacity 0.2s ease;

    @media screen and (max-width: 767px) {
      font-size: rem(13px);
      line-height: 1.35;
    }

    &:hover {
      opacity: 1;
      text-decoration: underline;
      text-underline-offset: 3px;
    }
  }

  &__contact {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: rem(10px);

    @media screen and (max-width: 767px) {
      gap: rem(8px);
    }

    li {
      display: flex;
      align-items: flex-start;
      gap: rem(8px);
      font-size: rem(14px);
      line-height: 1.45;
      opacity: 0.92;

      @media screen and (max-width: 767px) {
        font-size: rem(13px);
        gap: rem(8px);
      }

      i {
        font-size: rem(16px);
        margin-top: rem(1px);
        flex-shrink: 0;

        @media screen and (max-width: 767px) {
          font-size: rem(15px);
        }
      }
    }
  }

  &__bottom {
    border-top: 1px solid rgba($color-secondary, 0.18);
  }

  &__badges {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: rem(14px) rem(20px);
    padding: rem(16px) rem(15px);
    border-top: 1px solid rgba($color-secondary, 0.18);

    @media screen and (max-width: 767px) {
      flex-direction: column;
      gap: rem(12px);
      padding: rem(14px) rem(15px);
    }
  }

  &__netopia-badge {
    display: inline-block;
    width: rem(140px);
    height: rem(28px);
    max-width: 100%;
    line-height: 0;
  }

  &__badge-link {
    display: inline-block;
    line-height: 0;
    border-radius: rem(8px);
    overflow: hidden;
    transition:
      opacity 0.2s ease,
      transform 0.2s ease;

    &:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    &:focus-visible {
      outline: 2px solid $color-secondary;
      outline-offset: 3px;
    }

    &--anpc img {
      display: block;
      width: rem(140px);
      height: rem(28px);
      max-width: 100%;
    }
  }

  &__copyright {
    margin: 0;
    padding: rem(14px) rem(15px);
    text-align: center;
    font-size: rem(13px);
    opacity: 0.75;

    @media screen and (max-width: 767px) {
      padding: rem(12px) rem(15px);
      font-size: rem(12px);
      line-height: 1.4;
    }
  }
}
</style>

<i18n lang="json">
{
  "ro": {
    "tagline": "Povestea pământului transformat în obiecte cu suflet. Lucrăm fiecare piesă cu răbdare și respect pentru meșteșugul tradițional.",
    "taglineShort": "Ceramică lucrată manual, cu suflet și răbdare.",
    "infoHeading": "Informații",
    "workshopHeading": "Date firmă",
    "companyIds": "CUI {cui} · Reg. Com. {tradeRegister}",
    "deliveryReturns": "Livrare & Retur",
    "ceramicCare": "Întreținere ceramică",
    "terms": "Termeni și condiții",
    "privacy": "Prelucrarea datelor cu caracter personal",
    "cookies": "Politica de utilizare Cookie-uri",
    "contact": "Contact",
    "anpcSal": "ANPC – Soluționarea alternativă a litigiilor",
    "paymentsHeading": "Metode de plată acceptate",
    "netopiaPayments": "NETOPIA Payments",
    "copyright": "© {year} {company}. Creat cu dragoste pentru frumos."
  },
  "en": {
    "tagline": "The story of earth transformed into objects with soul. We craft each piece with patience and respect for traditional craftsmanship.",
    "taglineShort": "Handcrafted ceramics, made with patience and care.",
    "infoHeading": "Information",
    "workshopHeading": "Company details",
    "companyIds": "VAT ID {cui} · Trade Register {tradeRegister}",
    "deliveryReturns": "Shipping & Returns",
    "ceramicCare": "Ceramic care",
    "terms": "Terms and conditions",
    "privacy": "Personal data processing",
    "cookies": "Cookie Policy",
    "contact": "Contact",
    "anpcSal": "ANPC – Alternative dispute resolution",
    "paymentsHeading": "Accepted payment methods",
    "netopiaPayments": "NETOPIA Payments",
    "copyright": "© {year} {company}. Made with love for beauty."
  }
}
</i18n>
