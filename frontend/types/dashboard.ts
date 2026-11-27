export type SalesPoint = {
  key: string;
  mugsSold: number;
  totalValueRon: number;
  customersCount: number;
};

export type DashboardRecentOrder = {
  id: number;
  publicOrderNumber: string;
  createdAt: string;
  customerName: string;
  mugsSold: number;
  totalRon: number;
  statuses: string[];
};

export type DashboardArtistOption = {
  id: number;
  displayName: string;
};

export type DashboardRangeId =
  | "previousMonth"
  | "currentMonth"
  | "last3"
  | "lastYear";

export type SalesSlice = {
  mugsSold: number;
  totalValueRon: number;
  customersCount: number;
  points: SalesPoint[];
  recentOrders: DashboardRecentOrder[];
};

export type ArtistSalesRanges = {
  artistId: number;
  displayName: string;
  ranges: Record<DashboardRangeId, SalesSlice>;
};

export type SalesDashboard = {
  artists: DashboardArtistOption[];
  canFilterArtists: boolean;
  ranges: Record<DashboardRangeId, SalesSlice>;
  byArtist: ArtistSalesRanges[];
};

export type SalesDashboardQuery = {
  artistId?: number;
};

export type DashboardWidgetType = "value" | "mugs" | "customers" | "orders";
export type DashboardChartType = "bar" | "line";

export type DashboardWidget = {
  id: string;
  type: DashboardWidgetType;
  chartType: DashboardChartType;
  range: DashboardRangeId;
  artistId: number | null;
};
