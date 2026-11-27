<template>
  <div>
    <div class="flex justify-end mb-4">
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-full border border-[#144111] px-4 py-2 text-sm h-color-palm-leaf"
        @click="addOpen = true"
      >
        <i class="ph ph-plus"></i>
        {{ t("addChart") }}
      </button>
    </div>

    <p v-if="widgets.length === 0" class="h-color-lunar-green mb-4">
      {{ t("emptyBoard") }}
    </p>

    <TransitionGroup
      tag="div"
      name="dashboard-card"
      class="dashboard-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
      :class="{ 'dashboard-grid--dragging': dragFrom !== null }"
    >
      <article
        v-for="(widget, index) in widgets"
        :key="widget.id"
        draggable="true"
        class="dashboard-card h-bg-white rounded-xl shadow p-4 flex flex-col aspect-square min-w-0"
        :class="{ 'dashboard-card--dragging': dragFrom === index }"
        :aria-label="t('dragToMove')"
        @dragstart="onDragStart(index, $event)"
        @dragover="onDragOver(index, $event)"
        @drop="onDrop"
        @dragend="onDragEnd"
      >
        <header class="flex items-start justify-between gap-2">
          <div class="flex items-start gap-2 min-w-0">
            <i class="ph ph-dots-six-vertical mt-0.5 text-lg h-color-lunar-green" aria-hidden="true"></i>
            <div class="min-w-0">
              <h3 class="text-sm font-medium h-color-lunar-green">
                {{ t(widget.type) }}
              </h3>
              <p class="text-2xl font-bold h-color-palm-leaf mt-1 truncate">
                {{ widgetTotal(widget.type) }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <button
              v-if="widget.type !== 'orders'"
              type="button"
              draggable="false"
              class="h-8 w-8 rounded-lg transition-colors duration-200"
              :class="widget.chartType === 'bar' ? 'h-bg-palm-leaf text-white' : 'h-color-lunar-green'"
              :aria-label="t('barChart')"
              @click="setChartType(widget.id, 'bar')"
            >
              <i class="ph ph-chart-bar"></i>
            </button>
            <button
              v-if="widget.type !== 'orders'"
              type="button"
              draggable="false"
              class="h-8 w-8 rounded-lg transition-colors duration-200"
              :class="widget.chartType === 'line' ? 'h-bg-palm-leaf text-white' : 'h-color-lunar-green'"
              :aria-label="t('lineChart')"
              @click="setChartType(widget.id, 'line')"
            >
              <i class="ph ph-chart-line"></i>
            </button>
            <button
              type="button"
              draggable="false"
              class="h-8 w-8 rounded-lg h-color-lunar-green transition-colors duration-200"
              :aria-label="t('remove')"
              @click="removeWidget(widget.id)"
            >
              <i class="ph ph-x"></i>
            </button>
          </div>
        </header>

        <div class="mt-3 flex flex-col gap-2" draggable="false" @dragstart.stop.prevent>
          <Select
            v-if="stats.canFilterArtists"
            :model-value="widget.artistId ?? 0"
            :options="artistOptions"
            option-label="label"
            option-value="value"
            class="w-full"
            :aria-label="t('artist')"
            @update:model-value="setArtist(widget.id, $event)"
          />
          <Select
            :model-value="widget.range"
            :options="rangeOptions"
            option-label="label"
            option-value="value"
            class="w-full"
            :aria-label="t('period')"
            @update:model-value="setRange(widget.id, $event)"
          />
        </div>

        <div
          v-if="widget.type === 'orders'"
          class="mt-3 flex-1 min-h-0 overflow-y-auto"
        >
          <p
            v-if="sliceFor(widget).recentOrders.length === 0"
            class="text-sm h-color-lunar-green"
          >
            {{ t("noOrders") }}
          </p>
          <ul v-else class="flex flex-col gap-3">
            <li
              v-for="order in sliceFor(widget).recentOrders"
              :key="order.id"
              class="text-sm h-color-lunar-green"
            >
              <p class="font-semibold">{{ order.publicOrderNumber }}</p>
              <p>{{ order.customerName }}</p>
              <p>
                {{ order.mugsSold }} {{ t("mugsShort") }} ·
                {{ formatMoney(order.totalRon) }}
              </p>
              <p v-if="order.statuses.length > 0">
                {{ order.statuses.map((status) => t(`status.${status}`)).join(", ") }}
              </p>
              <p class="text-xs">{{ formatOrderDate(order.createdAt) }}</p>
            </li>
          </ul>
        </div>
        <div
          v-else
          class="mt-2 flex-1 min-h-0"
          role="img"
          :aria-label="chartLabel(widget.type)"
        >
          <ClientOnly>
            <Chart
              :type="widget.chartType"
              :data="chartData(widget)"
              :options="chartOptions(widget.type)"
              class="h-full w-full"
            />
          </ClientOnly>
        </div>
      </article>
    </TransitionGroup>

    <Dialog
      v-model:visible="addOpen"
      modal
      :header="t('addChart')"
      :style="{ width: '26rem' }"
    >
      <p v-if="availableTypes.length === 0" class="h-color-lunar-green">
        {{ t("allAdded") }}
      </p>
      <div v-else class="flex flex-col gap-2">
        <button
          v-for="type in availableTypes"
          :key="type"
          type="button"
          class="rounded-xl border border-[#e8e8e8] px-4 py-3 text-left h-color-lunar-green hover:border-[#144111]"
          @click="addWidget(type)"
        >
          <span class="block font-semibold">{{ t(type) }}</span>
          <span class="block text-sm mt-1">{{ t(`${type}Hint`) }}</span>
        </button>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import Dialog from "primevue/dialog";
import Select from "primevue/select";
import type {
  DashboardChartType,
  DashboardRangeId,
  DashboardWidget,
  DashboardWidgetType,
  SalesDashboard,
  SalesSlice,
} from "~/types/dashboard";

const props = defineProps<{
  stats: SalesDashboard;
  userId: number;
}>();

const { t, locale } = useI18n({ useScope: "local" });

const WIDGET_TYPES: DashboardWidgetType[] = [
  "value",
  "mugs",
  "customers",
  "orders",
];
const RANGE_IDS: DashboardRangeId[] = [
  "previousMonth",
  "currentMonth",
  "last3",
  "lastYear",
];
const CHART_COLORS: Record<Exclude<DashboardWidgetType, "orders">, string> = {
  value: "#144111",
  mugs: "#8a9772",
  customers: "#065f46",
};

const addOpen = ref(false);
const widgets = ref<DashboardWidget[]>(defaultWidgets());
const dragFrom = ref<number | null>(null);

const numberLocale = computed(() =>
  locale.value === "en" ? "en-US" : "ro-RO",
);

const rangeOptions = computed(() =>
  RANGE_IDS.map((range) => ({
    label: t(range),
    value: range,
  })),
);

const artistOptions = computed(() => [
  { label: t("allArtists"), value: 0 },
  ...props.stats.artists.map((artist) => ({
    label: artist.displayName,
    value: artist.id,
  })),
]);

const availableTypes = computed(() =>
  WIDGET_TYPES.filter(
    (type) => !widgets.value.some((widget) => widget.type === type),
  ),
);

watch(
  () => props.userId,
  (userId) => {
    widgets.value = readWidgets(userId);
  },
  { immediate: true },
);

watch(
  widgets,
  (value) => {
    if (!import.meta.client || props.userId <= 0) {
      return;
    }
    localStorage.setItem(storageKey(props.userId), JSON.stringify(value));
  },
  { deep: true },
);

function storageKey(userId: number): string {
  return `maini-admin-dashboard:${userId}`;
}

function defaultWidgets(): DashboardWidget[] {
  return [
    { id: "value", type: "value", chartType: "line", range: "currentMonth", artistId: null },
    { id: "mugs", type: "mugs", chartType: "bar", range: "currentMonth", artistId: null },
    { id: "customers", type: "customers", chartType: "line", range: "currentMonth", artistId: null },
    { id: "orders", type: "orders", chartType: "bar", range: "currentMonth", artistId: null },
  ];
}

function readWidgets(userId: number): DashboardWidget[] {
  if (!import.meta.client || userId <= 0) {
    return defaultWidgets();
  }
  const raw = localStorage.getItem(storageKey(userId));
  if (!raw) {
    return defaultWidgets();
  }
  try {
    return sanitizeWidgets(JSON.parse(raw));
  } catch {
    return defaultWidgets();
  }
}

function sanitizeWidgets(value: unknown): DashboardWidget[] {
  if (!Array.isArray(value)) {
    return defaultWidgets();
  }
  const seen = new Set<DashboardWidgetType>();
  const widgetsFromStorage: DashboardWidget[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const candidate = item as {
      type?: DashboardWidgetType;
      chartType?: DashboardChartType;
      range?: DashboardRangeId;
      artistId?: number | null;
    };
    if (!candidate.type || !WIDGET_TYPES.includes(candidate.type) || seen.has(candidate.type)) {
      continue;
    }
    seen.add(candidate.type);
    widgetsFromStorage.push({
      id: candidate.type,
      type: candidate.type,
      chartType: candidate.chartType === "line" ? "line" : "bar",
      range:
        candidate.range && RANGE_IDS.includes(candidate.range)
          ? candidate.range
          : "currentMonth",
      artistId: typeof candidate.artistId === "number" ? candidate.artistId : null,
    });
  }
  return widgetsFromStorage;
}

function addWidget(type: DashboardWidgetType) {
  widgets.value = [
    ...widgets.value,
    {
      id: type,
      type,
      chartType: type === "value" || type === "customers" ? "line" : "bar",
      range: "currentMonth",
      artistId: null,
    },
  ];
  addOpen.value = false;
}

function removeWidget(id: string) {
  widgets.value = widgets.value.filter((widget) => widget.id !== id);
}

function onDragStart(index: number, event: DragEvent) {
  const target = event.target;
  if (target instanceof Element && target.closest("button")) {
    event.preventDefault();
    return;
  }
  dragFrom.value = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  }
}

function pointerPassedTarget(
  from: number,
  index: number,
  event: DragEvent,
): boolean {
  const target = event.currentTarget;
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const bounds = target.getBoundingClientRect();
  const midpointX = bounds.left + bounds.width / 2;
  const midpointY = bounds.top + bounds.height / 2;
  const sameRow =
    event.clientY >= bounds.top && event.clientY <= bounds.bottom;
  if (sameRow) {
    return index > from
      ? event.clientX > midpointX
      : event.clientX < midpointX;
  }
  return index > from
    ? event.clientY > midpointY
    : event.clientY < midpointY;
}

function onDragOver(index: number, event: DragEvent) {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move";
  }
  const from = dragFrom.value;
  if (from === null || from === index || !pointerPassedTarget(from, index, event)) {
    return;
  }
  const next = [...widgets.value];
  const [moved] = next.splice(from, 1);
  if (!moved) {
    return;
  }
  next.splice(index, 0, moved);
  widgets.value = next;
  dragFrom.value = index;
}

function onDrop(event: DragEvent) {
  event.preventDefault();
  dragFrom.value = null;
}

function onDragEnd() {
  dragFrom.value = null;
}

function setChartType(id: string, chartType: DashboardChartType) {
  widgets.value = widgets.value.map((widget) =>
    widget.id === id ? { ...widget, chartType } : widget,
  );
}

function setRange(id: string, range: unknown) {
  if (typeof range !== "string" || !RANGE_IDS.includes(range as DashboardRangeId)) {
    return;
  }
    widgets.value = widgets.value.map((widget) =>
    widget.id === id ? { ...widget, range: range as DashboardRangeId } : widget,
  );
}

function setArtist(id: string, value: unknown) {
  const artistId = Number(value);
  const allowed =
    artistId === 0 ||
    props.stats.artists.some((artist) => artist.id === artistId);
  if (!allowed) {
    return;
  }
  widgets.value = widgets.value.map((widget) =>
    widget.id === id
      ? { ...widget, artistId: artistId === 0 ? null : artistId }
      : widget,
  );
}

function sliceFor(widget: DashboardWidget): SalesSlice {
  if (props.stats.canFilterArtists && widget.artistId) {
    const artist = props.stats.byArtist.find(
      (item) => item.artistId === widget.artistId,
    );
    if (artist) {
      return artist.ranges[widget.range];
    }
  }
  return props.stats.ranges[widget.range];
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat(numberLocale.value, {
    style: "currency",
    currency: "RON",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatCount(amount: number): string {
  return new Intl.NumberFormat(numberLocale.value, {
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatMonth(monthKey: string, monthStyle: "long" | "short"): string {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat(numberLocale.value, {
    month: monthStyle,
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, (month || 1) - 1, 1)));
}

function formatOrderDate(value: string): string {
  if (!value) {
    return "";
  }
  return new Intl.DateTimeFormat(numberLocale.value, {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

function pointLabel(key: string): string {
  if (key.length === 7) {
    return formatMonth(key, "short");
  }
  return String(Number(key.slice(-2)));
}

function seriesFor(widget: DashboardWidget): number[] {
  const slice = sliceFor(widget);
  if (widget.type === "value") {
    return slice.points.map((point) => point.totalValueRon);
  }
  if (widget.type === "mugs") {
    return slice.points.map((point) => point.mugsSold);
  }
  if (widget.type === "customers") {
    return slice.points.map((point) => point.customersCount);
  }
  return [];
}

function widgetTotal(type: DashboardWidgetType): string {
  const widget = widgets.value.find((item) => item.type === type);
  const slice = widget ? sliceFor(widget) : props.stats.ranges.currentMonth;
  if (type === "value") {
    return formatMoney(slice.totalValueRon);
  }
  if (type === "mugs") {
    return formatCount(slice.mugsSold);
  }
  if (type === "customers") {
    return formatCount(slice.customersCount);
  }
  return formatCount(slice.recentOrders.length);
}

function chartData(widget: DashboardWidget) {
  const color = CHART_COLORS[widget.type === "orders" ? "value" : widget.type];
  const values = seriesFor(widget);
  return {
    labels: sliceFor(widget).points.map((point) => pointLabel(point.key)),
    datasets: [
      widget.chartType === "line"
        ? {
            label: t(widget.type),
            data: values,
            borderColor: color,
            backgroundColor: color,
            tension: 0.35,
            pointRadius: 2,
            fill: false,
          }
        : {
            label: t(widget.type),
            data: values,
            backgroundColor: color,
            borderRadius: 6,
            maxBarThickness: 18,
          },
    ],
  };
}

function chartOptions(type: DashboardWidgetType) {
  const formatTick =
    type === "value"
      ? (amount: number) => formatMoney(amount)
      : (amount: number) => formatCount(amount);
  const reduceMotion =
    import.meta.client &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: reduceMotion
      ? false
      : { duration: 700, easing: "easeOutQuart" as const },
    plugins: { legend: { display: false } },
    scales: {
      x: {
        ticks: { color: "#414241", maxRotation: 0, autoSkip: true, font: { size: 10 } },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: "#414241",
          maxTicksLimit: 4,
          font: { size: 10 },
          callback: (value: string | number) => formatTick(Number(value)),
        },
      },
    },
  };
}

function chartLabel(type: DashboardWidgetType): string {
  const widget = widgets.value.find((item) => item.type === type);
  const slice = widget ? sliceFor(widget) : props.stats.ranges.currentMonth;
  const values = widget ? seriesFor(widget) : [];
  const points = slice.points
    .map((point, index) => {
      const value = values[index] ?? 0;
      const formatted = type === "value" ? formatMoney(value) : formatCount(value);
      return `${pointLabel(point.key)} ${formatted}`;
    })
    .join(", ");
  return `${t(type)}. ${points}`;
}
</script>

<i18n lang="json">
{
  "ro": {
    "addChart": "Adaugă grafic",
    "emptyBoard": "Adaugă un grafic ca să vezi vânzările din perioada aleasă.",
    "allAdded": "Toate graficele sunt deja pe dashboard.",
    "value": "Vânzări",
    "valueHint": "Valoarea canilor vândute, în lei.",
    "mugs": "Cani vândute",
    "mugsHint": "Numărul de cani vândute.",
    "customers": "Clienți",
    "customersHint": "Câți clienți au comandat de la tine.",
    "orders": "Ultimele comenzi",
    "ordersHint": "Cele mai recente comenzi din perioada aleasă.",
    "period": "Perioadă",
    "artist": "Artist",
    "allArtists": "Toți artiștii",
    "status.PENDING": "În așteptare",
    "status.PROCESSING": "În procesare",
    "status.SHIPPED": "Expediat",
    "status.DELIVERED": "Livrat",
    "status.CANCELLED": "Anulat",
    "previousMonth": "Ultima lună",
    "currentMonth": "Luna curentă",
    "last3": "Ultimele 3 luni",
    "lastYear": "Ultimul an",
    "barChart": "Grafic bare",
    "lineChart": "Grafic linie",
    "dragToMove": "Trage cardul ca să îl muți",
    "remove": "Elimină graficul",
    "noOrders": "Nicio comandă în perioada aleasă.",
    "mugsShort": "cani"
  },
  "en": {
    "addChart": "Add chart",
    "emptyBoard": "Add a chart to see sales for the selected period.",
    "allAdded": "Every chart is already on the dashboard.",
    "value": "Sales",
    "valueHint": "Value of the mugs sold, in lei.",
    "mugs": "Mugs sold",
    "mugsHint": "Number of mugs sold.",
    "customers": "Customers",
    "customersHint": "How many customers ordered from you.",
    "orders": "Recent orders",
    "ordersHint": "The latest orders in the selected period.",
    "period": "Period",
    "artist": "Artist",
    "allArtists": "All artists",
    "status.PENDING": "Pending",
    "status.PROCESSING": "Processing",
    "status.SHIPPED": "Shipped",
    "status.DELIVERED": "Delivered",
    "status.CANCELLED": "Cancelled",
    "previousMonth": "Last month",
    "currentMonth": "Current month",
    "last3": "Last 3 months",
    "lastYear": "Last year",
    "barChart": "Bar chart",
    "lineChart": "Line chart",
    "dragToMove": "Drag the card to move it",
    "remove": "Remove chart",
    "noOrders": "No orders in the selected period.",
    "mugsShort": "mugs"
  }
}
</i18n>

<style scoped>
.dashboard-card {
  cursor: grab;
  transition:
    transform 0.28s ease,
    box-shadow 0.28s ease,
    opacity 0.28s ease;
}

.dashboard-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 14px 30px rgba(20, 65, 17, 0.12);
}

.dashboard-card--dragging {
  cursor: grabbing;
  opacity: 0.72;
  transform: scale(0.98);
}

.dashboard-card-move {
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.dashboard-grid--dragging .dashboard-card-move,
.dashboard-grid--dragging .dashboard-card:hover {
  transition: none;
  transform: none;
}

.dashboard-grid--dragging .dashboard-card--dragging {
  transform: scale(0.98);
}

.dashboard-card-enter-active {
  transition:
    opacity 0.4s ease,
    transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

.dashboard-card-leave-active {
  position: absolute;
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.dashboard-card-enter-from,
.dashboard-card-leave-to {
  opacity: 0;
  transform: translateY(14px) scale(0.97);
}

@media (prefers-reduced-motion: reduce) {
  .dashboard-card,
  .dashboard-card-move,
  .dashboard-card-enter-active,
  .dashboard-card-leave-active {
    transition: none;
  }

  .dashboard-card:hover,
  .dashboard-card--dragging {
    transform: none;
  }
}
</style>
