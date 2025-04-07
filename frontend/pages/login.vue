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
        <form @submit.prevent="handleLogin">
          <div class="flex flex-col">
            <label for="email" class="text-left h-font-size-14 mb-1">
              Email
            </label>
            <input
              type="email"
              autocomplete="email"
              id="email"
              class="h-bg-alto h-font-weight-400 h-font-size-16 rounded-md p-1 inset-shadow-sm"
              v-model="email"
            />
          </div>
          <div class="flex flex-col mt-2">
            <label for="password" class="text-left h-font-size-14 mb-1">
              {{ t("password") }}
            </label>
            <input
              type="password"
              autocomplete="current-password"
              id="password"
              class="h-bg-alto h-font-weight-400 h-font-size-16 rounded-md p-1 inset-shadow-sm"
              v-model="password"
            />
            <div class="flex justify-start mt-1">
              <NuxtLink
                to="#"
                class="h-font-weight-400 h-font-size-12 h-color-lunar-green underline"
                >{{ t("forgot-password") }}</NuxtLink
              >
            </div>
          </div>
        </form>
        <Button
          class="maini-ui-button__primary h-font-size-14 mt-4 w-full"
          @click="handleLogin"
          >{{ t("sign-in-cta") }}</Button
        >
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
          class="maini-ui-button__google h-color-black h-bg-white w-full flex items-center justify-center gap-2"
          @click="handleGoogleLogin"
        >
          <nuxt-img
            src="images/google-logo.svg"
            alt="Google"
            class="w-4 h-4 mr-1"
          />
          {{ t("sign-in-with-google") }}
        </Button>
        <div class="flex flex-row justify-center mt-6">
          <div class="mr-1 h-font-size-12 h-color-lunar-green">
            {{ t("dont-have-account") }}
          </div>
          <NuxtLink
            to="/register"
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

const router = useRouter();
const { t } = useI18n({
  useScope: "local",
});
const email = ref("");
const password = ref("");

const handleLogin = async () => {
  try {
    const response = await fetch("http://localhost:4000/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.value,
        password: password.value,
      }),
    });

    const data = await response.json();
    if (data.access_token) {
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/");
    } else {
      alert("Login failed. Please check your credentials.");
    }
  } catch (error) {
    console.error("Login failed:", error);
    alert("An error occurred during login. Please try again.");
  }
};

const handleGoogleLogin = () => {
  window.location.href = "http://localhost:4000/auth/google";
};
</script>

<i18n lang="json">
{
  "en": {
    "heading": "Welcome back!",
    "sub-heading": "Sign in to your account",
    "password": "Password",
    "sign-in-cta": "Sign in",
    "sign-in-with-google": "Sign in with Google",
    "forgot-password": "Forgot your password?",
    "dont-have-account": "Don't have an account?",
    "sign-up": "Sign up",
    "or-continue-with": "Or continue with"
  },
  "ro": {
    "heading": "Bine ai revenit!",
    "sub-heading": "Autentificare în contul dvs.",
    "password": "Parola",
    "sign-in-cta": "Autentificare",
    "sign-in-with-google": "Autentificare cu Google",
    "forgot-password": "Ai uitat parola?",
    "dont-have-account": "Nu ai un cont?",
    "sign-up": "Înregistrează-te",
    "or-continue-with": "Sau continuă cu"
  }
}
</i18n>
