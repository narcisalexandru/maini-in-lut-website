export type SiteSettings = {
  easyboxFeeRon: number;
  addressFeeRon: number;
  deliveryDaysMin: number;
  deliveryDaysMax: number;
  announcementTextRo: string;
  announcementTextEn: string;
};

export const DEFAULT_ANNOUNCEMENT_RO =
  "Livrare estimată în {min}–{max} zile lucrătoare. Easybox {easybox} RON · livrare la adresă {address} RON.";
export const DEFAULT_ANNOUNCEMENT_EN =
  "Estimated delivery in {min}–{max} business days. Easybox {easybox} RON · address delivery {address} RON.";

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  easyboxFeeRon: 15,
  addressFeeRon: 15,
  deliveryDaysMin: 3,
  deliveryDaysMax: 7,
  announcementTextRo: DEFAULT_ANNOUNCEMENT_RO,
  announcementTextEn: DEFAULT_ANNOUNCEMENT_EN,
};

export function useSiteSettings() {
  const { apiFetch } = useApi();

  const getPublicSettings = async (): Promise<SiteSettings> => {
    const response = await apiFetch<SiteSettings>("/site-settings", {
      auth: false,
    });
    return normalizeSettings(response);
  };

  const getAdminSettings = () =>
    apiFetch<SiteSettings>("/admin/site-settings").then(normalizeSettings);

  const updateAdminSettings = (payload: SiteSettings) =>
    apiFetch<SiteSettings>("/admin/site-settings", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }).then(normalizeSettings);

  return { getPublicSettings, getAdminSettings, updateAdminSettings };
}

function normalizeSettings(settings: SiteSettings): SiteSettings {
  return {
    easyboxFeeRon: Number(settings.easyboxFeeRon),
    addressFeeRon: Number(settings.addressFeeRon),
    deliveryDaysMin: Number(settings.deliveryDaysMin),
    deliveryDaysMax: Number(settings.deliveryDaysMax),
    announcementTextRo: settings.announcementTextRo ?? DEFAULT_ANNOUNCEMENT_RO,
    announcementTextEn: settings.announcementTextEn ?? DEFAULT_ANNOUNCEMENT_EN,
  };
}
