import type {
  SalesDashboard,
  SalesDashboardQuery,
} from "~/types/dashboard";

export function useDashboard() {
  const { apiFetch } = useApi();

  const getArtistSales = (query: SalesDashboardQuery = {}) => {
    const params = new URLSearchParams();
    if (query.artistId) {
      params.set("artistId", String(query.artistId));
    }
    const suffix = params.toString();
    return apiFetch<SalesDashboard>(
      `/admin/dashboard/sales${suffix ? `?${suffix}` : ""}`,
    );
  };

  return { getArtistSales };
}
