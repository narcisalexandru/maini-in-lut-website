import type {
  AdminArtist,
  ArtistApplication,
  ArtistApplyPayload,
} from "~/types/artist";
import type { AdminProduct } from "~/types/product";

export function useArtist() {
  const { apiFetch } = useApi();

  const getMyApplication = () =>
    apiFetch<ArtistApplication | null>("/artists/me/application");

  const apply = (payload: ArtistApplyPayload) =>
    apiFetch<ArtistApplication>("/artists/apply", {
      method: "POST",
      body: JSON.stringify(payload),
    });

  const getPublicProfile = (slug: string) =>
    apiFetch<import("~/types/artist").PublicArtist>(`/artists/${slug}`, {
      auth: false,
    });

  const listArtists = (status?: string) => {
    const query = status ? `?status=${status}` : "";
    return apiFetch<AdminArtist[]>(`/admin/artists${query}`);
  };

  const getArtist = (id: number) =>
    apiFetch<AdminArtist>(`/admin/artists/${id}`);

  const approveArtist = (id: number) =>
    apiFetch<AdminArtist>(`/admin/artists/${id}/approve`, {
      method: "PATCH",
    });

  const rejectArtist = (id: number, reason: string) =>
    apiFetch<AdminArtist>(`/admin/artists/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    });

  const suspendArtist = (id: number, reason: string) =>
    apiFetch<AdminArtist>(`/admin/artists/${id}/suspend`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    });

  const dismissSuspensionNotice = () =>
    apiFetch<ArtistApplication>("/artists/me/suspension-notice/dismiss", {
      method: "PATCH",
    });

  const dismissReactivationNotice = () =>
    apiFetch<ArtistApplication>("/artists/me/reactivation-notice/dismiss", {
      method: "PATCH",
    });

  const reactivateArtist = (id: number) =>
    apiFetch<AdminArtist>(`/admin/artists/${id}/reactivate`, {
      method: "PATCH",
    });

  const deleteArtistAccount = (id: number) =>
    apiFetch<{ success: boolean; message: string }>(
      `/admin/artists/${id}/account`,
      { method: "DELETE" },
    );

  const listMyProducts = (params?: { status?: string; artistId?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set("status", params.status);
    if (params?.artistId) searchParams.set("artistId", String(params.artistId));
    const query = searchParams.toString();
    return apiFetch<AdminProduct[]>(`/admin/products${query ? `?${query}` : ""}`);
  };

  const listReviewQueue = () =>
    apiFetch<AdminProduct[]>("/admin/products/review-queue");

  const createProduct = (payload: Record<string, unknown>) =>
    apiFetch<AdminProduct>("/admin/products", {
      method: "POST",
      body: JSON.stringify(payload),
    });

  const getActiveDraft = () =>
    apiFetch<AdminProduct | null>("/admin/products/active-draft");

  const getProduct = (id: number) =>
    apiFetch<AdminProduct>(`/admin/products/${id}`);

  const saveProductDraft = (payload: Record<string, unknown>) =>
    apiFetch<AdminProduct>("/admin/products/draft", {
      method: "PUT",
      body: JSON.stringify(payload),
    });

  const deleteProductDraft = (id: number) =>
    apiFetch<{ success: boolean }>(`/admin/products/${id}/draft`, {
      method: "DELETE",
    });

  const deleteProduct = (id: number) =>
    apiFetch<{ success: boolean }>(`/admin/products/${id}`, {
      method: "DELETE",
    });

  const updateProduct = (id: number, payload: Record<string, unknown>) =>
    apiFetch<AdminProduct>(`/admin/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

  const submitProduct = (id: number) =>
    apiFetch<AdminProduct>(`/admin/products/${id}/submit`, {
      method: "POST",
    });

  const submitProductChanges = (id: number, payload: Record<string, unknown>) =>
    apiFetch<AdminProduct>(`/admin/products/${id}/submit-changes`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

  const approveProduct = (id: number) =>
    apiFetch<AdminProduct>(`/admin/products/${id}/approve`, {
      method: "PATCH",
    });

  const reviewProductChanges = (
    id: number,
    payload: {
      action: "accept-fields" | "reject-fields" | "accept-all" | "reject-all";
      fields?: string[];
      reason?: string;
    },
  ) =>
    apiFetch<AdminProduct>(`/admin/products/${id}/review-changes`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

  const rejectProduct = (id: number, reason: string) =>
    apiFetch<AdminProduct>(`/admin/products/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    });

  const proposeProductChanges = (id: number, changes: Record<string, unknown>) =>
    apiFetch<AdminProduct>(`/admin/products/${id}/propose-changes`, {
      method: "PATCH",
      body: JSON.stringify(changes),
    });

  const acceptProductChanges = (id: number) =>
    apiFetch<AdminProduct>(`/admin/products/${id}/accept-changes`, {
      method: "POST",
    });

  const rejectProductChanges = (id: number, message?: string) =>
    apiFetch<AdminProduct>(`/admin/products/${id}/reject-changes`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });

  const uploadProductImages = (files: File[]) => {
    const formData = new FormData();
    for (const file of files) {
      formData.append("images", file);
    }
    return apiFetch<{ urls: string[] }>("/admin/uploads/product-images", {
      method: "POST",
      body: formData,
    });
  };

  return {
    getMyApplication,
    apply,
    getPublicProfile,
    listArtists,
    getArtist,
    approveArtist,
    rejectArtist,
    suspendArtist,
    dismissSuspensionNotice,
    dismissReactivationNotice,
    reactivateArtist,
    deleteArtistAccount,
    listMyProducts,
    listReviewQueue,
    createProduct,
    getActiveDraft,
    getProduct,
    saveProductDraft,
    deleteProductDraft,
    deleteProduct,
    updateProduct,
    submitProduct,
    submitProductChanges,
    approveProduct,
    reviewProductChanges,
    rejectProduct,
    proposeProductChanges,
    acceptProductChanges,
    rejectProductChanges,
    uploadProductImages,
  };
}
