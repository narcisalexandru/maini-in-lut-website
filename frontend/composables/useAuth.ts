import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

export const useAuth = () => {
  const router = useRouter();
  const { locale } = useI18n();

  const user = ref({
    email: "",
    first_name: "",
    last_name: "",
    address: "",
    picture: "",
    phone: "",
  });

  const isAuthenticated = computed(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    return !!token && !!storedUser;
  });

  const checkAuth = () => {
    if (!isAuthenticated.value) {
      const loginPath = locale.value === "en" ? "/en/login" : "/login";
      router.push(loginPath);
      return false;
    }
    return true;
  };

  const loadUser = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      user.value = JSON.parse(storedUser);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    const loginPath = locale.value === "en" ? "/en/login" : "/login";
    router.push(loginPath);
  };

  return {
    user,
    isAuthenticated,
    checkAuth,
    loadUser,
    logout,
  };
};
