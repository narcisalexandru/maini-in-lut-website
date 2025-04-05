<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md mx-auto">
      <h2 class="text-center text-3xl font-extrabold text-gray-900 mb-8">
        Your Profile
      </h2>

      <form @submit.prevent="handleUpdateProfile" class="space-y-6">
        <div>
          <label
            for="first_name"
            class="block text-sm font-medium text-gray-700"
            >First Name</label
          >
          <input
            id="first_name"
            v-model="profile.first_name"
            type="text"
            required
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label for="last_name" class="block text-sm font-medium text-gray-700"
            >Last Name</label
          >
          <input
            id="last_name"
            v-model="profile.last_name"
            type="text"
            required
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-gray-700"
            >Email</label
          >
          <input
            id="email"
            v-model="profile.email"
            type="email"
            disabled
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 sm:text-sm"
          />
        </div>

        <div>
          <label for="address" class="block text-sm font-medium text-gray-700"
            >Address</label
          >
          <textarea
            id="address"
            v-model="profile.address"
            rows="3"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          ></textarea>
        </div>

        <div
          v-if="updateMessage"
          :class="[
            'text-center p-2 rounded',
            updateMessage.type === 'success'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700',
          ]"
        >
          {{ updateMessage.text }}
        </div>

        <div>
          <button
            type="submit"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Update Profile
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

const profile = ref({
  first_name: "",
  last_name: "",
  email: "",
  address: "",
});

const updateMessage = ref<{ type: "success" | "error"; text: string } | null>(
  null
);

onMounted(async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      navigateTo("/login");
      return;
    }

    const response = await fetch("http://localhost:4000/users/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      profile.value = data;
    }
  } catch (error) {
    console.error("Failed to fetch profile:", error);
  }
});

const handleUpdateProfile = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      navigateTo("/login");
      return;
    }

    const response = await fetch("http://localhost:4000/users/profile", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        first_name: profile.value.first_name,
        last_name: profile.value.last_name,
        address: profile.value.address,
      }),
    });

    if (response.ok) {
      updateMessage.value = {
        type: "success",
        text: "Profile updated successfully",
      };
    } else {
      updateMessage.value = {
        type: "error",
        text: "Failed to update profile",
      };
    }
  } catch (error) {
    console.error("Failed to update profile:", error);
    updateMessage.value = {
      type: "error",
      text: "Failed to update profile",
    };
  }
};
</script>
