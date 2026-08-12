import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { ChevronRight, Plus } from "lucide-react";
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type TooltipItem,
} from "chart.js";
import { Chart, Line } from "react-chartjs-2";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import type { DailyMetricEntry } from "@/utils/dailyMetricLog";
import {
  computeYAxisRange,
  computeZeroBasedYAxisRange,
  extendYAxisRangeToInclude,
} from "@/utils/chartAxis";
import {
  formatDisplayDayNumber,
  formatDisplayMonthYear,
  formatDisplayShort,
  toLocalDateString,
} from "@/utils/dateFormat";
import { toFaDigits } from "@/utils/numberFormat";
import {
  buildDailyBuckets,
  buildMonthlyBuckets,
  buildWeekBuckets,
  type MissingDayMeaning,
  type StatBucket,
} from "@/utils/statBuckets";
import { getAppSettings, weekStartDayNumber } from "@/utils/appSettingsEngine";

// Rows the Y-axis always shows, regardless of range — never fewer, so a
// single point (or a flat week) never collapses onto the bottom edge.
const Y_AXIS_ROWS = 4;

// Bars are measured from a zero baseline, so their axis can't be centered
// on the data and needs more rows to stay readable: four rows from zero
// would put a 2100-calorie day on a 1000-apart grid.
const BAR_Y_AXIS_ROWS = 7;

// A drag shorter than this (px) is a tap/scroll attempt, not a pan — same
// threshold-before-capture idea SideMenu's own drag handling uses, so a
// plain tap on the chart (or a vertical scroll of the page starting on it)
// never gets mistaken for a horizontal pan.
const DRAG_START_THRESHOLD_PX = 6;

// How far back (in days) a panned chart can go — a sanity backstop, not
// tied to how far back the account's own data actually reaches (an empty
// window just shows the existing "چیزی ثبت نشده" state).
const MAX_PAN_OFFSET_DAYS = 3650;

// The bar chart goes through the generic <Chart> rather than <Bar>, because
// its goal line is a line dataset inside a bar chart and only the generic
// component's types admit a mixed dataset list. <Chart> registers nothing on
// its own, hence both controllers here.
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  LineController,
  BarController,
  Filler,
  Tooltip,
);

const CHART_FONT_FAMILY = "Vazirmatn";

export type StatRangeKey = "day" | "week" | "month" | "sixMonth" | "year";

type RangeKey = StatRangeKey;

// What the headline above the chart is called, per range — "کالری روزانه",
// "میانگین ماهیانه" and so on. Week and month share one label because both
// report a per-day figure, and 6-month/year share one because both report a
// per-month figure.
export interface StatSummaryLabels {
  day: string;
  daily: string;
  monthly: string;
}

const RANGES: { key: RangeKey; label: string; days: number }[] = [
  { key: "day", label: "روز", days: 0 },
  { key: "week", label: "هفته", days: 7 },
  { key: "month", label: "ماه", days: 30 },
  { key: "sixMonth", label: "۶ ماه", days: 180 },
  { key: "year", label: "سال", days: 365 },
];

/* On an iOS home-screen-installed (standalone) PWA, cold launch can lay
   the page out against a stale viewport that WebKit only corrects a
   moment later — and that late correction doesn't reliably reach
   chart.js's own ResizeObserver, leaving the canvas frozen at the stale
   width: start-aligned (= pushed against the right edge in this RTL app)
   and clipped at the screen edge. Same root cause as MobileContainer's
   useViewportHeight, so this mirrors its exact signal set — staggered
   settle timers plus every resize-ish event — and imperatively tells the
   chart to re-measure its container on each one. resize() is a no-op
   when the size hasn't actually changed, so the extra calls are free. */
function useChartResizeOnViewportSettle() {
  // One ref per chart type, because only one of the two ever renders and
  // chart.js types them separately. resize() on the null one is skipped.
  const lineRef = useRef<ChartJS<"line"> | null>(null);
  const barRef = useRef<ChartJS<"bar" | "line"> | null>(null);

  useEffect(() => {
    const resize = () => {
      lineRef.current?.resize();
      barRef.current?.resize();
    };

    const settleTimers = [100, 400, 1000, 2500].map((delay) =>
      window.setTimeout(resize, delay)
    );

    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", resize);
    window.addEventListener("pageshow", resize);
    window.visualViewport?.addEventListener("resize", resize);

    return () => {
      settleTimers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener("resize", resize);
      window.removeEventListener("orientationchange", resize);
      window.removeEventListener("pageshow", resize);
      window.visualViewport?.removeEventListener("resize", resize);
    };
  }, []);

  return { lineRef, barRef };
}

function isoToLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);

  return new Date(y, m - 1, d);
}

function daysAgoIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);

  return toLocalDateString(date);
}

// Same as `new Date()` but shifted back by a panned window's own offset —
// every "today"-anchored calculation below (entries cutoff, date-range
// label) reads the window's actual last day through this instead of the
// real today once the chart's been dragged into the past.
function anchorDate(offsetDays: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - offsetDays);

  return date;
}

// The first day of a fixed calendar week — Saturday..Friday or
// Monday..Sunday per the "روز شروع هفته" setting — `weekOffset` whole weeks
// back from the week containing today. Shared between chartPoints
// (buildWeekBuckets) and dateRangeLabel so both describe the exact same
// week rather than the label drifting from what the bars actually show.
function weekStartDate(weekStartDay: number, weekOffset: number): Date {
  const today = new Date();
  const daysSinceWeekStart = (today.getDay() - weekStartDay + 7) % 7;

  const start = new Date(today);
  start.setDate(today.getDate() - daysSinceWeekStart - weekOffset * 7);

  return start;
}

export interface StatChartPageProps {
  title: string;
  unitLabel: string;
  color: string;
  history: DailyMetricEntry[];
  // Y-axis gridlines never step finer than this — e.g. 1 for a weight
  // chart in kg, so it can't ever show a sub-kilogram gridline.
  minYStep: number;
  // Rounds displayed values (calories/water are whole numbers; weight
  // wants one decimal place). Defaults to 1 (whole numbers).
  valuePrecision?: number;
  // Omit both to hide the top-left "+" entirely — for a derived/read-only
  // chart (e.g. the calorie-budget trend) with no "add" action of its own.
  onAdd?: () => void;
  addLabel?: string;
  // Draws a dashed horizontal reference line at this value (e.g. the
  // weight page's target weight) so the chart can be read against a goal
  // at a glance — omit for stats with no such goal (calories/water/
  // activity).
  targetValue?: number;
  targetLabel?: string;
  // What a day with nothing logged means for this stat — see
  // MissingDayMeaning. "gap" (the default) suits a point-in-time
  // measurement like weight; daily totals like calories and activity pass
  // "zero", which both keeps their line continuous and makes their
  // monthly figures a real per-day average instead of an average over
  // only the days that happened to get logged.
  missingDays?: MissingDayMeaning;
  // "line" (the default) for a metric that traces a value over time.
  // "bar" for a daily total like calories or activity, where each column
  // is one day's own amount — day/week/month draw a bar per day, and the
  // 6-month/year ranges a bar per month holding that month's daily
  // average. A total is a quantity per day, not a continuous curve
  // through them, so columns say what it is where a line implies
  // interpolation between days that never happened.
  chartType?: "line" | "bar";
  // For a bar chart whose value can go negative (e.g. over budget) rather
  // than only ever growing from a zero baseline — axis centers on the data
  // while still guaranteeing zero is inside it (so the "over" bars have
  // somewhere to go below the line), and each bar past zero is drawn in
  // `negativeColor` instead of `color`. Only meaningful with chartType="bar".
  signedBars?: boolean;
  negativeColor?: string;
  // Swaps the built-in chart.js line for a custom renderer, given the same
  // buckets this component already computed for the selected range. The
  // weight page uses it for a hand-drawn SVG chart with its own axis
  // rules; everything else leaves it off and keeps the shared chart.
  renderChart?: (points: StatBucket[]) => ReactNode;
  // Which range is selected on arrival. Defaults to the month.
  defaultRange?: StatRangeKey;
  // Restricts which range pills show up at all — omit for every range
  // (the default). The weight page drops "روز" (a single point is nothing
  // to chart) and hides the summary figure too (see showSummary) rather
  // than showing a number that doesn't mean much for a point-in-time
  // metric across a whole range.
  availableRanges?: StatRangeKey[];
  // Hides the big number above the chart (and its label/date-range text)
  // entirely. Defaults to true — off only for the weight page, where the
  // range's own average was reading as more authoritative than it should
  // for a point-in-time metric, and the chart already shows the trend.
  showSummary?: boolean;
  // Fires whenever the selected range changes (including once on mount,
  // with the initial range) — for a caller whose renderChart needs to know
  // which range is active right now, since chartPoints alone doesn't say.
  onRangeChange?: (range: StatRangeKey) => void;
  // Naming the headline per range also decides what it reports. Every label
  // callers pass describes a single bucket ("کالری روزانه", "میانگین
  // ماهیانه"), so a named headline is always a representative per-bucket
  // figure: that day's own value, the per-day average across week/month, the
  // per-month average across 6-month/year. Left off, the headline keeps the
  // older behaviour where a daily total sums its week/month instead of
  // averaging them, and is labelled مجموع/میانگین accordingly.
  summaryLabels?: StatSummaryLabels;
  // Extra content below the chart panel, in the page's normal scroll flow
  // (e.g. the weight page's target/current-weight rows).
  children?: ReactNode;
}

export default function StatChartPage({
  title,
  unitLabel,
  color,
  history,
  minYStep,
  valuePrecision = 1,
  onAdd,
  addLabel,
  targetValue,
  targetLabel = "هدف",
  missingDays = "gap",
  chartType = "line",
  signedBars = false,
  negativeColor = "#f87171",
  renderChart,
  defaultRange = "month",
  availableRanges,
  showSummary = true,
  onRangeChange,
  summaryLabels,
  children,
}: StatChartPageProps) {
  const navigate = useNavigate();
  const [range, setRangeState] = useState<RangeKey>(defaultRange);
  const { lineRef, barRef } = useChartResizeOnViewportSettle();
  const chartAreaRef = useRef<HTMLDivElement>(null);

  // How many days back from today the visible window's own last day sits
  // — 0 means the window ends today (the normal case). Dragging the chart
  // left slides the whole window into the past without changing its width
  // (still exactly 7 or 30 days), dragging right brings it back toward
  // today. See handlePointerMove below.
  const [windowOffsetDays, setWindowOffsetDays] = useState(0);
  const dragState = useRef<{
    startX: number;
    startOffset: number;
    pxPerDay: number;
    dragging: boolean;
  } | null>(null);

  function setRange(next: RangeKey) {
    setRangeState(next);
    setWindowOffsetDays(0);
    onRangeChange?.(next);
  }

  // Fires once for the initial range too, same as every later change — a
  // caller relying on this to know the active range shouldn't have to
  // special-case "before the first tap".
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => onRangeChange?.(range), []);

  const visibleRanges = availableRanges
    ? RANGES.filter((r) => availableRanges.includes(r.key))
    : RANGES;

  const activeRange = RANGES.find((r) => r.key === range)!;

  // Read once per render, not memoized — it's a plain localStorage read, no
  // heavier than the history array this component already re-derives from
  // on every render.
  const weekStartDay = weekStartDayNumber(getAppSettings().weekStart);

  // Only week/month are day-bucketed windows of a fixed width worth
  // panning through one day at a time — 6-month/year are already just six
  // or twelve whole-month points (nothing to slide a day at a time), and a
  // single day has no "earlier" within itself to drag to.
  const isPannable = range === "week" || range === "month";

  function handlePointerDown(e: ReactPointerEvent) {
    if (!isPannable) return;

    const rect = chartAreaRef.current?.getBoundingClientRect();
    const pxPerDay = rect && activeRange.days > 0 ? rect.width / activeRange.days : 40;

    dragState.current = {
      startX: e.clientX,
      startOffset: windowOffsetDays,
      pxPerDay,
      dragging: false,
    };
  }

  function handlePointerMove(e: ReactPointerEvent) {
    const state = dragState.current;
    if (!state) return;

    const deltaX = e.clientX - state.startX;

    if (!state.dragging) {
      if (Math.abs(deltaX) < DRAG_START_THRESHOLD_PX) return;

      state.dragging = true;
      (e.target as Element).setPointerCapture?.(e.pointerId);
    }

    // Dragging left (negative deltaX) reveals earlier days, so the offset
    // grows; dragging right shrinks it back toward 0 (today). A calendar
    // week only ever slides by whole weeks — a partial week would land on
    // a 7-day slice that starts on the wrong weekday — so "week" rounds to
    // the nearest multiple of 7 instead of the nearest single day.
    const deltaDays =
      range === "week"
        ? Math.round(-deltaX / (state.pxPerDay * 7)) * 7
        : Math.round(-deltaX / state.pxPerDay);
    const next = Math.min(
      MAX_PAN_OFFSET_DAYS,
      Math.max(0, state.startOffset + deltaDays),
    );

    setWindowOffsetDays(next);
  }

  function handlePointerUp() {
    dragState.current = null;
  }

  // The real logged entries within the active window — used for the
  // average/date-range text (which should reflect what was actually
  // logged, not the zero-filled/aggregated chart buckets below). Reads
  // through the pan offset (0 outside week/month) so a panned chart's own
  // summary/date-range describe the window actually on screen.
  const entries = useMemo(() => {
    let cutoff: string;
    let endIso: string;

    if (range === "week") {
      const start = weekStartDate(weekStartDay, windowOffsetDays / 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      cutoff = toLocalDateString(start);
      endIso = toLocalDateString(end);
    } else {
      cutoff = daysAgoIso(activeRange.days + windowOffsetDays);
      endIso = daysAgoIso(windowOffsetDays);
    }

    return history
      .filter((entry) => entry.date >= cutoff && entry.date <= endIso)
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [history, activeRange.days, windowOffsetDays, range, weekStartDay]);

  // What the chart itself renders. Week/month get one bucket per calendar
  // day (even days with nothing logged, as a real gap — not skipped, so
  // the chart always spans the full window instead of shrinking to
  // wherever the sparse data happens to sit); 6-month and year aggregate
  // into one bucket per month, so 6-month always shows exactly six ticks
  // labelled with the last six month numbers, each the average of what was
  // logged that month. Only the day range plots a real entry directly.
  const chartPoints: StatBucket[] = useMemo(() => {
    if (range === "week")
      return buildWeekBuckets(history, weekStartDay, missingDays, windowOffsetDays / 7);
    if (range === "month") return buildDailyBuckets(history, 30, missingDays, windowOffsetDays);
    if (range === "sixMonth") return buildMonthlyBuckets(history, 6, missingDays);
    if (range === "year") return buildMonthlyBuckets(history, 12, missingDays);

    return entries.map((entry) => ({
      label: formatDisplayDayNumber(isoToLocalDate(entry.date)),
      value: entry.value,
    }));
  }, [range, history, entries, missingDays, windowOffsetDays, weekStartDay]);

  const hasData = chartPoints.some((point) => point.value !== null);

  const isDailyTotal = missingDays === "zero";
  const usesMonthlyBuckets = range === "sixMonth" || range === "year";

  // Without explicit labels: a daily total's day/week/month ranges draw one
  // bar per day, so the headline reports what those bars add up to; only
  // 6-month/year average, because their buckets already are per-month
  // averages and summing averages would mean nothing. A point-in-time
  // metric (weight) averages its real measurements, where a skipped day
  // genuinely shouldn't count.
  const summaryLabel = summaryLabels
    ? range === "day"
      ? summaryLabels.day
      : usesMonthlyBuckets
        ? summaryLabels.monthly
        : summaryLabels.daily
    : isDailyTotal && !usesMonthlyBuckets
      ? "مجموع"
      : "میانگین";

  const summaryValue = useMemo(() => {
    const mean = (values: number[]) =>
      values.length === 0
        ? null
        : values.reduce((sum, value) => sum + value, 0) / values.length;

    const bucketValues = chartPoints
      .map((point) => point.value)
      .filter((value): value is number => value !== null);

    const entryValues = entries.map((entry) => entry.value);

    if (summaryLabels) {
      // 6-month/year read the monthly buckets, since their label promises a
      // monthly average. Below that, a daily total reads its daily buckets
      // so a day with nothing logged counts as the zero it is, while a
      // point-in-time metric reads only real measurements, where a day
      // that was never weighed shouldn't drag the number toward nothing.
      if (usesMonthlyBuckets) return mean(bucketValues);

      return mean(isDailyTotal ? bucketValues : entryValues);
    }

    if (isDailyTotal) {
      if (bucketValues.length === 0) return null;

      const total = bucketValues.reduce((sum, value) => sum + value, 0);

      return usesMonthlyBuckets ? total / bucketValues.length : total;
    }

    return mean(entryValues);
  }, [summaryLabels, isDailyTotal, usesMonthlyBuckets, chartPoints, entries]);

  // Describes the selected period itself — the same window the chart's
  // x-axis spans — not the first/last day that happens to have an entry.
  // Reading "۳۱ جولای – ۳ آگوست" while the ماه tab is selected made the
  // range look like it only covered the days with data.
  const dateRangeLabel = useMemo(() => {
    if (range === "week") {
      const start = weekStartDate(weekStartDay, windowOffsetDays / 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      return `${formatDisplayShort(start)} – ${formatDisplayShort(end)}`;
    }

    // The window's own last day — real "today" outside week/month (where
    // panning doesn't apply), or today shifted back by however far the
    // chart's been dragged.
    const windowEnd = anchorDate(windowOffsetDays);

    if (range === "day") {
      return formatDisplayShort(windowEnd);
    }

    const start = anchorDate(windowOffsetDays);

    if (range === "month") start.setDate(start.getDate() - 29);
    // 6-month/year are bucketed per month, so their window starts at the
    // first of the oldest month shown rather than a rolling day count.
    else start.setFullYear(windowEnd.getFullYear(), windowEnd.getMonth() - (range === "sixMonth" ? 5 : 11), 1);

    // 6-month/year read as whole months (e.g. "آگوست ۲۰۲۵ – ژانویه ۲۰۲۶") —
    // a day-of-month on either end would just be today's, which isn't
    // what either endpoint of a months-wide window actually means.
    return usesMonthlyBuckets
      ? `${formatDisplayMonthYear(start)} – ${formatDisplayMonthYear(windowEnd)}`
      : `${formatDisplayShort(start)} – ${formatDisplayShort(windowEnd)}`;
  }, [range, usesMonthlyBuckets, windowOffsetDays, weekStartDay]);

  // Sized from the real data only, so the target line (which can sit far
  // from it) never drags the resolution down around the actual trend —
  // extended afterward, separately, just enough to fit the target in too.
  const axisRows = chartType === "bar" ? BAR_Y_AXIS_ROWS : Y_AXIS_ROWS;
  const dataValues = chartPoints.map((p) => p.value ?? NaN);

  let yAxis =
    chartType === "bar"
      ? signedBars
        // Zero has to sit inside the range (not just be one of the bar
        // baselines) for both over- and under-budget bars to render — 0
        // is fed in alongside the real data so computeYAxisRange's own
        // containment guarantee covers it even on a week with every day
        // on the same side of budget.
        ? computeYAxisRange([...dataValues, 0], axisRows, minYStep)
        : computeZeroBasedYAxisRange(dataValues, axisRows, minYStep)
      : computeYAxisRange(dataValues, axisRows, minYStep);

  if (targetValue !== undefined) {
    // One extra row's headroom over the data-only axis: stretching to a
    // distant target needs somewhere to put the wider span without
    // collapsing to a very coarse step (a 4-row cap on the 85–101 case
    // would force 10kg gridlines; 5 rows lands on the natural 5kg ones).
    yAxis = extendYAxisRangeToInclude(yAxis, targetValue, axisRows + 1);
  }

  // Denser buckets (month's 30 days) get smaller points so they don't
  // visually collide into each other.
  const pointRadius = range === "month" ? 2 : 3;

  const labels = chartPoints.map((point) => point.label);
  const values = chartPoints.map((point) => point.value);

  // Drawn as a line dataset even inside the bar chart, so the goal reads as
  // a threshold across the whole range rather than as one more column.
  const targetDataset = {
    type: "line" as const,
    label: targetLabel,
    data: chartPoints.map(() => targetValue as number),
    borderColor: "#f87171",
    borderDash: [6, 4],
    borderWidth: 1.5,
    pointRadius: 0,
    pointHoverRadius: 0,
    fill: false,
    tension: 0,
  };

  const lineChartData = {
    labels,
    datasets: [
      {
        data: values,
        spanGaps: false,
        borderColor: color,
        backgroundColor: `${color}26`,
        pointBackgroundColor: color,
        pointRadius,
        pointHoverRadius: pointRadius + 2,
        tension: 0.3,
        fill: true,
      },
      ...(targetValue !== undefined ? [targetDataset] : []),
    ],
  };

  const barChartData: ChartData<"bar" | "line", (number | null)[], string> = {
    labels,
    datasets: [
      {
        type: "bar" as const,
        data: values,
        backgroundColor: signedBars
          ? ({ dataIndex }: { dataIndex: number }) =>
              (values[dataIndex] ?? 0) < 0 ? negativeColor : color
          : color,
        hoverBackgroundColor: signedBars
          ? ({ dataIndex }: { dataIndex: number }) =>
              (values[dataIndex] ?? 0) < 0 ? negativeColor : color
          : color,
        borderRadius: 4,
        // Rounds the top corners only; a bar sitting on the baseline
        // shouldn't have its bottom edge rounded away from it. A signed
        // bar's "bottom" (in the geometric, not baseline, sense) is
        // whichever end is farthest from zero — top for an over-budget bar
        // hanging below it — so rounding is skipped entirely there rather
        // than rounding the wrong corner.
        borderSkipped: signedBars ? false : ("bottom" as const),
        // A single day's bar would otherwise stretch across the whole plot.
        maxBarThickness: 26,
        // Leaves a visible sliver of space between columns even at 30 of
        // them, so a month reads as separate days rather than a block.
        categoryPercentage: 0.85,
        barPercentage: 0.8,
      },
      ...(targetValue !== undefined ? [targetDataset] : []),
    ],
  };

  // Week always shows all 7 labels (there's room); month leaves chart.js's
  // own autoSkip on so 30 labels at the panel's normal width don't collide
  // — the chart stays a fixed width and the window itself slides via
  // dragging (see handlePointerMove) instead of a wide scrollable canvas.
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        // Centers points within their slot instead of pinning the first/
        // last one flush to the plot edge — matters most for a single
        // point (the day range), which would otherwise sit right at the
        // edge instead of the middle of the chart.
        offset: true,
        ticks: {
          color: "#ffffff",
          font: { family: CHART_FONT_FAMILY, size: 10 },
          autoSkip: range !== "week",
          maxRotation: 0,
        },
        grid: { display: false },
      },
      y: {
        min: yAxis.min,
        max: yAxis.max,
        ticks: {
          stepSize: yAxis.stepSize,
          color: "#ffffff",
          font: { family: CHART_FONT_FAMILY, size: 10 },
          callback: (value: number | string) => toFaDigits(value),
        },
        grid: { color: "rgba(255,255,255,0.12)" },
      },
    },
    plugins: {
      tooltip: {
        titleFont: { family: CHART_FONT_FAMILY },
        bodyFont: { family: CHART_FONT_FAMILY },
        callbacks: {
          label: (context: TooltipItem<"line" | "bar">) => {
            const value = `${toFaDigits((context.parsed.y ?? 0).toFixed(valuePrecision))} ${unitLabel}`;

            return context.dataset.label ? `${context.dataset.label}: ${value}` : value;
          },
        },
      },
    },
  };

  return (
    <div>
      {/* Flush to the very top of the safe area. Taller than the original
          ~1/3-screen reference design — at that size the header row, range
          pills, and average text left barely any room for the chart
          itself, so it always rendered cramped. Rounded on the bottom
          only, since it's pinned to the top edge. */}
      <div
        className="glass-panel glass-panel-flush-top glass-static flex h-[58dvh] min-h-115 flex-col rounded-b-3xl rounded-t-none px-5 pb-3 pt-safe"
      >
        <div className="relative flex items-center justify-center pt-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="بازگشت"
            className="glass-chip absolute right-0 flex h-9 w-9 items-center justify-center rounded-full"
          >
            <ChevronRight size={18} />
          </button>

          <h1 className="text-lg font-bold text-white">{title}</h1>

          {onAdd && (
            <button
              onClick={onAdd}
              aria-label={addLabel}
              className="glass-chip absolute left-0 flex h-9 w-9 items-center justify-center rounded-full text-avocado-yellow"
            >
              <Plus size={18} />
            </button>
          )}
        </div>

        <div className="glass-chip relative mt-3 flex items-center justify-around rounded-full p-1">
          {visibleRanges.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className="relative z-10 flex-1 py-1.5 text-center text-xs font-medium text-white [-webkit-tap-highlight-color:transparent]"
            >
              {range === r.key && (
                <motion.div
                  layoutId="stat-chart-range-selection"
                  className="absolute inset-0 -z-10 rounded-full bg-white/15"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              {r.label}
            </button>
          ))}
        </div>

        {/* The date-range line (e.g. "۳۱ جولای – ۶ آگوست") shows regardless
            of showSummary — it says what window the chart/columns below
            actually span, which matters on its own even without the
            headline number above it. */}
        <div className="mt-3">
          {showSummary && (
            <>
              <p className="text-xs text-white/50">{summaryLabel}</p>
              <p className="text-white">
                <span className="text-2xl font-bold">
                  {summaryValue !== null ? toFaDigits(summaryValue.toFixed(valuePrecision)) : "—"}
                </span>{" "}
                <span className="text-sm text-white/60">{unitLabel}</span>
              </p>
            </>
          )}
          <div className="flex items-center justify-center gap-2">
            <p className="text-center text-xs text-white/50">{dateRangeLabel}</p>

            {/* Only once actually panned away from today — a quick way
                back rather than dragging all the way right again. */}
            {windowOffsetDays > 0 && (
              <button
                onClick={() => setWindowOffsetDays(0)}
                className="glass-chip glass-static rounded-full px-2 py-0.5 text-[11px] font-medium text-avocado-yellow"
              >
                امروز
              </button>
            )}
          </div>
        </div>

        {/* overflow-hidden: if the canvas is ever transiently mis-sized
            (the stale-viewport case useChartResizeOnViewportSettle exists
            for), it clips inside the panel instead of painting past the
            screen edge until the next resize signal lands. touch-action:
            pan-y lets the page still scroll vertically through a normal
            touch drag that starts on the chart — only a drag this handles
            as a deliberate horizontal pan (past DRAG_START_THRESHOLD_PX)
            captures the pointer away from that. */}
        <div
          ref={chartAreaRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative mt-2 min-h-0 flex-1 overflow-hidden"
          style={isPannable ? { touchAction: "pan-y" } : undefined}
        >
          {renderChart ? (
            renderChart(chartPoints)
          ) : chartType === "bar" ? (
            <Chart type="bar" ref={barRef} data={barChartData} options={chartOptions} />
          ) : (
            <Line ref={lineRef} data={lineChartData} options={chartOptions} />
          )}

          {!hasData && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-white/50">چیزی ثبت نشده</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4 px-5 pb-5 pt-4">{children}</div>
    </div>
  );
}
