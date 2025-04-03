export default defineNuxtPlugin((nuxtApp) => {
  const localizeImage = (src) => {
    const locale = nuxtApp.$i18n.locale;
    return `/images/${locale.value}${src}`;
  };

  nuxtApp.provide("localizeImage", localizeImage);
});
