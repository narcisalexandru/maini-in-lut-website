import { ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  county: string;
  locality: string;
  street: string;
  street_number: string;
  phone: string;
  picture?: string;
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

  const user = ref<User>({
    id: "",
    email: "",
    first_name: "",
    last_name: "",
    county: "",
    locality: "",
    street: "",
    street_number: "",
    phone: "",
    picture: "",
  });

  const isAuthenticated = ref(false);

  const setAuthData = (data: AuthResponse) => {
    if (data.access_token) {
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      user.value = data.user;
      isAuthenticated.value = true;
    }
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

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (!data.access_token) {
        throw new Error("No access token received");
      }

      setAuthData(data);
      return { success: true, data };
    } catch (err) {
      const error = handleAuthError(err);
      return { success: false, error };
    } finally {
      isLoading.value = false;
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    county: string;
    city: string;
    street: string;
    postal_code: string;
    phone: string;
  }) => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
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
      router.push(
        locale.value === "en"
          ? "/en/auth/email-verification"
          : "/auth/email-verification"
      );
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
    window.location.href = `${import.meta.env.VITE_BACKEND_URL}/auth/google`;
  };

  const checkAuth = () => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      isAuthenticated.value = true;
      user.value = JSON.parse(storedUser);
      return true;
    }

    isAuthenticated.value = false;
    const loginPath = locale.value === "en" ? "/en/login" : "/login";
    router.push(loginPath);
    return false;
  };

  const loadUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/users/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load user data");
      }

      const userData = await response.json();
      user.value = userData;
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    const loginPath = locale.value === "en" ? "/en/login" : "/login";
    router.push(loginPath);
  };

  const updateProfile = async (updateData: Partial<User>) => {
    try {
      isLoading.value = true;
      error.value = null;

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/users/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Profile update failed");
      }

      const updatedUser = { ...user.value, ...data };
      user.value = updatedUser;
      localStorage.setItem("user", JSON.stringify(updatedUser));

      return { success: true, data: updatedUser };
    } catch (err) {
      const error = handleAuthError(err);
      return { success: false, error };
    } finally {
      isLoading.value = false;
    }
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
    updateProfile,
  };
};
