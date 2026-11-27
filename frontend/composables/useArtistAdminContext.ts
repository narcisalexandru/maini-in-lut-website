import type { ComputedRef, InjectionKey, Ref } from "vue";
import type { AdminArtist } from "~/types/artist";

export interface ArtistAdminContext {
  artistId: ComputedRef<number>;
  artist: Ref<AdminArtist | null>;
  reloadArtist: () => Promise<void>;
}

export const artistAdminContextKey: InjectionKey<ArtistAdminContext> =
  Symbol("artistAdminContext");

export function useArtistAdminContext() {
  const context = inject(artistAdminContextKey);
  if (!context) {
    throw new Error("useArtistAdminContext must be used within artist admin layout");
  }
  return context;
}
