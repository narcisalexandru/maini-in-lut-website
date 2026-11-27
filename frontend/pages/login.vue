<template>
  <section class="maini-ui__section">
    <div class="maini-ui__extra-small-container">
      <div class="text-center h-bg-white rounded-lg shadow-lg p-8">
        <div class="h-font-weight-600 h-font-size-28 mt-8 h-color-palm-leaf">
          {{ t("heading") }}
        </div>
        <div
          class="h-font-weight-400 h-font-size-14 mb-8 mt-1 h-color-lunar-green"
        >
          {{ t("sub-heading") }}
        </div>
        <form
          data-js-submit
          method="post"
          novalidate
          @submit.prevent="handleSubmit"
        >
          <FormInput
            id="email"
            name="email"
            :label="t('email')"
            type="email"
            v-model="formData.email"
            :error="showError"
            :error-message="errorMessage"
            autocomplete="username"
            autocapitalize="none"
            autocorrect="off"
            :spellcheck="false"
            @blur="() => validateField('email', formData.email)"
          />
          <FormInput
            id="password"
            name="password"
            :label="t('password')"
            type="password"
            v-model="formData.password"
            :error="showError"
            :error-message="errorMessage"
            autocomplete="current-password"
            @blur="() => validateField('password', formData.password)"
          />
          <div class="flex justify-start mt-1">
            <button
              type="button"
              class="h-font-weight-400 h-font-size-12 h-color-lunar-green underline"
            >
              {{ t("forgot-password") }}
            </button>
          </div>
          <button
            class="p-button p-component maini-ui-button__primary h-font-size-16 mt-4 w-full"
            type="submit"
            :disabled="isLoading"
          >
            {{ isLoading ? t("loading") : t("sign-in-cta") }}
          </button>
          <p v-if="needsVerification" class="mt-3 text-sm h-color-lunar-green">
            <button type="button" class="underline" @click="resendVerificationEmail">
              {{ t("resend-verification") }}
            </button>
            <span v-if="resendMessage"> {{ resendMessage }}</span>
          </p>
          <p v-if="route.query.error === 'oauth'" class="mt-3 text-sm text-red-600">
            {{ t("oauth-failed") }}
          </p>
        </form>
        <div class="my-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span
                class="px-2 h-font-size-12 h-bg-white h-color-lunar-green"
                >{{ t("or-continue-with") }}</span
              >
            </div>
          </div>
        </div>
        <Button
          type="button"
          class="maini-ui-button__google h-color-black h-bg-white w-full flex items-center justify-center gap-2"
          @click="handleGoogleLogin"
          :disabled="isLoading"
        >
          <nuxt-img
            src="images/google-logo.svg"
            alt="Google"
            class="w-4 h-4 mr-1"
          />
          {{ t("sign-in-with-google-cta") }}
        </Button>
        <div class="flex flex-row justify-center mt-6">
          <div class="mr-1 h-font-size-12 h-color-lunar-green">
            {{ t("dont-have-account") }}
          </div>
          <NuxtLink
            :to="$localePath('/inregistrare')"
            class="h-font-weight-400 h-font-size-12 h-color-lunar-green underline"
          >
            {{ t("sign-up") }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import FormInput from "~/components/FormInput.vue";
import { useAuth } from "~/composables/useAuth";
import { useFormValidation } from "~/composables/useFormValidation";
import { formString } from "~/utils/form-values";

const router = useRouter();
const route = useRoute();

defineI18nRoute({
  paths: {
    ro: "/login",
    en: "/login",
  },
});

const { t } = useI18n({
  useScope: "local",
});

const { login, googleAuth, isLoading, resendVerification } = useAuth();
const { mergeGuestFavorites } = useFavorites();
const { mergeGuestCart } = useCart();

const formData = ref({
  email: "",
  password: "",
});

const showError = ref(false);
const errorMessage = ref("");
const needsVerification = ref(false);
const resendMessage = ref("");

const validationRules = {
  email: [
    {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: t("invalid-email"),
    },
  ],
  password: [
    {
      required: true,
      minLength: 8,
      message: t("password-too-short"),
    },
  ],
};

const { validateField, validateForm } = useFormValidation(validationRules);

const handleSubmit = async (event: Event) => {
  const form = event.target instanceof HTMLFormElement ? event.target : null;
  if (!form || isLoading.value) {
    return;
  }

  formData.value = {
    email: formString(form, "email", formData.value.email).trim(),
    password: formString(form, "password", formData.value.password),
  };

  const formDataToValidate = {
    email: formData.value.email,
    password: formData.value.password,
  };

  if (!validateForm(formDataToValidate)) {
    showError.value = true;
    errorMessage.value = t("invalid-credentials");
    return;
  }

  try {
    const result = await login(formData.value.email, formData.value.password);

    if (!result.success) {
      showError.value = true;
      needsVerification.value = result.error?.message === "EMAIL_NOT_VERIFIED";
      errorMessage.value = needsVerification.value
        ? t("email-not-verified")
        : result.error?.message || t("invalid-credentials");
      return;
    }

    showError.value = false;
    needsVerification.value = false;
    await mergeGuestFavorites();
    await mergeGuestCart();
    const redirect =
      typeof route.query.redirect === "string" ? route.query.redirect : "/";
    const safeRedirect =
      redirect.startsWith("/") &&
      !redirect.startsWith("//") &&
      !redirect.startsWith("/\\")
        ? redirect
        : "/";
    router.push(safeRedirect);
  } catch (error) {
    showError.value = true;
    errorMessage.value = t("invalid-credentials");
  }
};

const resendVerificationEmail = async () => {
  resendMessage.value = "";
  const sent = await resendVerification(formData.value.email);
  resendMessage.value = sent ? t("verification-sent") : t("verification-failed");
};

const handleGoogleLogin = () => {
  googleAuth();
};
</script>

<i18n lang="json">
{
  "en": {
    "heading": "Welcome back!",
    "sub-heading": "Sign in to your account",
    "email": "Email",
    "password": "Password",
    "sign-in-cta": "Sign in",
    "sign-in-with-google-cta": "Sign in with Google",
    "forgot-password": "Forgot your password?",
    "dont-have-account": "Don't have an account?",
    "sign-up": "Sign up",
    "or-continue-with": "Or continue with",
    "loading": "Loading...",
    "invalid-email": "Please enter a valid email address",
    "password-too-short": "Password must be at least 8 characters long",
    "invalid-credentials": "Invalid email or password",
    "email-not-verified": "Confirm your email before signing in.",
    "resend-verification": "Send the confirmation email again",
    "verification-sent": "If the account exists, a new email is on its way.",
    "verification-failed": "The email could not be sent. Try again in a minute.",
    "oauth-failed": "Google sign-in was cancelled. Try again."
  },
  "ro": {
    "heading": "Bine ai revenit!",
    "sub-heading": "Autentificare în contul dvs.",
    "email": "Email",
    "password": "Parola",
    "sign-in-cta": "Autentificare",
    "sign-in-with-google-cta": "Autentificare cu Google",
    "forgot-password": "Ai uitat parola?",
    "dont-have-account": "Nu ai un cont?",
    "sign-up": "Înregistrează-te",
    "or-continue-with": "Sau continuă cu",
    "loading": "Se încarcă...",
    "invalid-email": "Vă rugăm să introduceți o adresă de email validă",
    "password-too-short": "Parola trebuie să aibă cel puțin 8 caractere",
    "invalid-credentials": "Adresa de email sau parola gresite",
    "email-not-verified": "Confirmă adresa de email înainte de autentificare.",
    "resend-verification": "Trimite din nou emailul de confirmare",
    "verification-sent": "Dacă există un cont, un email nou este pe drum.",
    "verification-failed": "Emailul nu a putut fi trimis. Încearcă din nou peste un minut.",
    "oauth-failed": "Autentificarea Google a fost întreruptă. Încearcă din nou."
  }
}
</i18n>
