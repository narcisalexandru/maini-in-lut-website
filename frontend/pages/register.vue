<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="handleRegister">
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="firstname" class="sr-only">First Name</label>
            <input
              id="first_name"
              v-model="first_name"
              name="first_name"
              type="text"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="First Name"
            />
          </div>
          <div>
            <label for="Last Name" class="sr-only">Last Name</label>
            <input
              id="last_Name"
              v-model="last_name"
              name="last_Name"
              type="text"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Last Name"
            />
          </div>
          <div>
            <label for="address" class="sr-only">Address</label>
            <input
              id="address"
              v-model="address"
              name="address"
              type="text"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Address"
            />
          </div>
          <div>
            <label for="phone" class="sr-only">Phone</label>
            <input
              id="phone"
              v-model="phone"
              name="phone"
              type="text"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Phone"
            />
          </div>
          <div>
            <label for="email-address" class="sr-only">Email address</label>
            <input
              id="email-address"
              v-model="email"
              name="email"
              type="email"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Email address"
            />
          </div>
          <div>
            <label for="password" class="sr-only">Password</label>
            <input
              id="password"
              v-model="password"
              name="password"
              type="password"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Password"
            />
          </div>
          <div>
            <label for="confirmPassword" class="sr-only"
              >Confirm Password</label
            >
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Confirm Password"
            />
          </div>
        </div>

        <div v-if="passwordError" class="text-red-500 text-sm">
          {{ passwordError }}
        </div>

        <div>
          <button
            type="submit"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Sign up
          </button>
        </div>
      </form>

      <div class="text-center">
        <router-link
          to="/login"
          class="font-medium text-indigo-600 hover:text-indigo-500"
        >
          Already have an account? Sign in
        </router-link>
      </div>
    </div>
  </div>
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
