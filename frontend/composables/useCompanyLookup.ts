export interface CompanyLookupResult {
  name: string;
  cui: string;
  tradeRegister: string;
  address: string;
}

export function useCompanyLookup() {
  const loading = ref(false);
  const error = ref("");

  const lookupByCui = async (cui: string): Promise<CompanyLookupResult | null> => {
    const cleaned = String(cui || "").replace(/\D/g, "");
    if (!cleaned) {
      error.value = "CUI invalid";
      return null;
    }

    const base =
      import.meta.env.VITE_BACKEND_URL ||
      useRuntimeConfig().public.apiBase ||
      "";

    loading.value = true;
    error.value = "";

    try {
      const response = await fetch(`${base}/checkout/company/${cleaned}`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        error.value =
          typeof data?.message === "string"
            ? data.message
            : "Nu s-au putut prelua datele firmei";
        return null;
      }

      return data as CompanyLookupResult;
    } catch {
      error.value = "Nu s-au putut prelua datele firmei";
      return null;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    lookupByCui,
  };
}
