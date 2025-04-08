import { ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  address?: string;
  phone?: string;
}

interface AuthResponse {
  access_token: string;
  user: User;
}

interface AuthError {
  message: string;
  field?: string;
}

export const useAuth = () => {
  const router = useRouter();
  const { locale, t } = useI18n();
  const isLoading = ref(false);
  const error = ref<AuthError | null>(null);

  const user = ref({
    email: "",
    first_name: "",
    last_name: "",
    address: "",
    picture: "",
    phone: "",
  });

  const isAuthenticated = ref(false);

  const setAuthData = (data: AuthResponse) => {
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));
    isAuthenticated.value = true;
  };

  const handleAuthError = (err: any): AuthError => {
    console.error("Authentication error:", err);
    const errorMessage =
      err.message || "An error occurred during authentication";
    error.value = { message: errorMessage };
    return error.value;
  };

  const login = async (email: string, password: string) => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await fetch("http://localhost:4000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      setAuthData(data);
      router.push("/");
      return data;
    } catch (err) {
      return handleAuthError(err);
    } finally {
      isLoading.value = false;
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    address: string;
    phone: string;
  }) => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await fetch("http://localhost:4000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (data.message === "Email already exists") {
          error.value = {
            message: t("email-already-exists"),
            field: "email",
          };
          throw error.value;
        }
        if (data.message === "Phone number already exists") {
          error.value = {
            message: t("phone-already-exists"),
            field: "phone",
          };
          throw error.value;
        }
        throw new Error(data.message || "Registration failed");
      }

      setAuthData(data);
      router.push("/profile");
      return data;
    } catch (err) {
      if (err instanceof Error) {
        return handleAuthError(err);
      }
      return err as AuthError;
    } finally {
      isLoading.value = false;
    }
  };

  const googleAuth = () => {
    window.location.href = "http://localhost:4000/auth/google";
  };

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
    login,
    register,
    googleAuth,
    isLoading,
    error,
  };
};
