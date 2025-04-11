<template>
  <section class="maini-ui__section">
    <div class="maini-ui__container">
      <h1 class="maini-ui__heading">{{ t("one-more") }}...</h1>
      <div class="maini-ui__small-container">
        <div class="h-color-lunar-green h-font-size-24 text-center">
          {{ t("sub-heading") }}
        </div>
        <div class="h-color-lunar-green h-font-size-16 text-center my-6">
          {{ t("description") }}
        </div>
      </div>
      <div class="flex flex-col">
        <div class="flex justify-center mb-4 h-color-lunar-green text-center">
          {{ t("button-text") }}
        </div>
        <div class="flex flex-row gap-4 justify-center items-center">
          <div v-for="link in mailLinks" :key="link.name">
            <Button
              as="a"
              class="maini-ui-button__mail h-14 text-white hover:text-white active:text-white"
              :href="link.url"
              target="_blank"
              rel="noopener"
            >
              <nuxt-img
                :src="link.icon"
                :alt="link.name"
                class="img-responsive w-10"
              />
            </Button>
          </div>
        </div>
        <div class="flex justify-center">
          <NuxtLink :to="$localePath('/login')" class="">
            <Button class="maini-ui-button__primary mt-8 w-auto">
              {{ t("login-cta") }}
            </Button>
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineI18nRoute({
  paths: {
    ro: "/auth/email-verification",
    en: "/auth/email-verification",
  },
});

const { t } = useI18n({
  useScope: "local",
});

const mailLinks = [
  {
    name: "Gmail",
    url: "https://gmail.com",
    icon: "/images/gmail-logo.png",
  },
  {
    name: "Yahoo",
    url: "https://yahoo.com",
    icon: "/images/yahoo-logo.png",
  },
  {
    name: "Outlook",
    url: "https://outlook.com",
    icon: "/images/outlook-logo.png",
  },
];
</script>

<i18n lang="json">
{
  "en": {
    "heading": "Email Verification",
    "one-more": "One more step",
    "sub-heading": "We've sent a verification link to your email address",
    "description": "For security reasons, we have sent a verification link to your email address. Please check your email and follow the steps there to verify your account",
    "button-text": "Here are some links to help you out",
    "login-cta": "Go to Login"
  },
  "ro": {
    "heading": "Verificare Email",
    "one-more": "Încă un pas",
    "sub-heading": "Am trimis un link de verificare la adresa ta de email",
    "description": "Din motive de securitate am trimis un link de verificare la adresa ta de email. Te rugăm să verifici adresa de email și să urmezi pasii de acolo pentru a-ți verifica contul",
    "button-text": "Uite aici câteva linkuri pentru a te ajuta",
    "login-cta": "Spre Autentificare"
  }
}
</i18n>

<style scoped lang="scss">
@import "~/assets/scss/_variables.scss";

.maini-ui-button {
  &__mail {
    color: $white;
    background-color: $color-secondary;
    border-color: $color-primary;
    &:hover {
      color: $white;
      background-color: darken($color-secondary, 10%);
    }
    &:active {
      color: $white;
      background-color: darken($color-secondary, 20%);
    }
  }
}
</style>
