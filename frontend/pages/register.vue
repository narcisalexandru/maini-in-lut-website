<template>
  <section class="maini-ui__section">
    <div class="maini-ui__extra-small-container">
      <div class="text-center h-bg-white rounded-lg shadow-lg p-8">asdads</div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const first_name = ref("");
const last_name = ref("");
const address = ref("");
const phone = ref("");

const passwordError = computed(() => {
  if (
    password.value &&
    confirmPassword.value &&
    password.value !== confirmPassword.value
  ) {
    return "Passwords do not match";
  }
  if (password.value && password.value.length < 8) {
    return "Password must be at least 8 characters long";
  }
  if (password.value && !/(?=.*[A-Z])/.test(password.value)) {
    return "Password must contain at least one uppercase letter";
  }
  if (password.value && !/(?=.*\d.*\d)/.test(password.value)) {
    return "Password must contain at least two numbers";
  }
  if (password.value && !/(?=.*[!@#$%^&*])/.test(password.value)) {
    return "Password must contain at least one special character";
  }
  return "";
});

const handleRegister = async () => {
  if (passwordError.value) {
    return;
  }

  try {
    const response = await fetch("http://localhost:4000/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.value,
        password: password.value,
        first_name: first_name.value,
        last_name: last_name.value,
        address: address.value,
        phone: phone.value,
      }),
    });

    const data = await response.json();
    if (data.access_token) {
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/profile");
    }
  } catch (error) {
    console.error("Registration failed:", error);
  }
};
</script>
