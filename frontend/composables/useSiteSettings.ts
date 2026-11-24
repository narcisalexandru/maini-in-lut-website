export type SiteSettings = {
  easyboxFeeRon: number;
  addressFeeRon: number;
  deliveryDaysMin: number;
  deliveryDaysMax: number;
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  easyboxFeeRon: 15,
  addressFeeRon: 15,
  deliveryDaysMin: 3,
  deliveryDaysMax: 7,
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
  };
}
