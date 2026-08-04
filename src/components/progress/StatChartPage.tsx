import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
import { formatDayNumber, formatGregorianShort } from "@/utils/dateFormat";
import { toFaDigits } from "@/utils/numberFormat";
import {
  buildDailyBuckets,
  buildMonthlyBuckets,
  type MissingDayMeaning,
  type StatBucket,
} from "@/utils/statBuckets";

// Rows the Y-axis always shows, regardless of range — never fewer, so a
// single point (or a flat week) never collapses onto the bottom edge.
const Y_AXIS_ROWS = 4;

// Bars are measured from a zero baseline, so their axis can't be centered
// on the data and needs more rows to stay readable: four rows from zero
// would put a 2100-calorie day on a 1000-apart grid.
const BAR_Y_AXIS_ROWS = 7;

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

type RangeKey = "day" | "week" | "month" | "sixMonth" | "year";

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

  return date.toISOString().split("T")[0];
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
  onAdd: () => void;
  addLabel: string;
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
  // Swaps the built-in chart.js line for a custom renderer, given the same
  // buckets this component already computed for the selected range. The
  // weight page uses it for a hand-drawn SVG chart with its own axis
  // rules; everything else leaves it off and keeps the shared chart.
  renderChart?: (points: StatBucket[]) => ReactNode;
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
  renderChart,
  children,
}: StatChartPageProps) {
  const navigate = useNavigate();
  const [range, setRange] = useState<RangeKey>("month");
  const { lineRef, barRef } = useChartResizeOnViewportSettle();

  const activeRange = RANGES.find((r) => r.key === range)!;

  // The real logged entries within the active window — used for the
  // average/date-range text (which should reflect what was actually
  // logged, not the zero-filled/aggregated chart buckets below).
  const entries = useMemo(() => {
    const cutoff = daysAgoIso(activeRange.days);

    return history
      .filter((entry) => entry.date >= cutoff)
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [history, activeRange.days]);

  // What the chart itself renders. Week/month get one bucket per calendar
  // day (even days with nothing logged, as a real gap — not skipped, so
  // the chart always spans the full window instead of shrinking to
  // wherever the sparse data happens to sit); 6-month and year aggregate
  // into one bucket per month, so 6-month always shows exactly six ticks
  // labelled with the last six month numbers, each the average of what was
  // logged that month. Only the day range plots a real entry directly.
  const chartPoints: StatBucket[] = useMemo(() => {
    if (range === "week") return buildDailyBuckets(history, 7, missingDays);
    if (range === "month") return buildDailyBuckets(history, 30, missingDays);
    if (range === "sixMonth") return buildMonthlyBuckets(history, 6, missingDays);
    if (range === "year") return buildMonthlyBuckets(history, 12, missingDays);

    return entries.map((entry) => ({
      label: formatDayNumber(isoToLocalDate(entry.date)),
      value: entry.value,
    }));
  }, [range, history, entries, missingDays]);

  const hasData = chartPoints.some((point) => point.value !== null);

  const isDailyTotal = missingDays === "zero";
  const usesMonthlyBuckets = range === "sixMonth" || range === "year";

  // A daily total's day/week/month ranges draw one bar per day, each the
  // day's own amount — so the headline reports what those bars add up to
  // rather than flattening them into an average nobody asked for. Only the
  // 6-month/year ranges average, because their buckets already are
  // per-month averages and summing averages would mean nothing. A
  // point-in-time metric (weight) still averages its real measurements,
  // where a skipped day genuinely shouldn't count.
  const summaryLabel = isDailyTotal && !usesMonthlyBuckets ? "مجموع" : "میانگین";

  const summaryValue = useMemo(() => {
    if (isDailyTotal) {
      const values = chartPoints
        .map((point) => point.value)
        .filter((value): value is number => value !== null);

      if (values.length === 0) return null;

      const total = values.reduce((sum, value) => sum + value, 0);

      return usesMonthlyBuckets ? total / values.length : total;
    }

    if (entries.length === 0) return null;

    return entries.reduce((sum, entry) => sum + entry.value, 0) / entries.length;
  }, [isDailyTotal, usesMonthlyBuckets, chartPoints, entries]);

  // Describes the selected period itself — the same window the chart's
  // x-axis spans — not the first/last day that happens to have an entry.
  // Reading "۳۱ جولای – ۳ آگوست" while the ماه tab is selected made the
  // range look like it only covered the days with data.
  const dateRangeLabel = useMemo(() => {
    const today = new Date();

    if (range === "day") {
      return formatGregorianShort(today);
    }

    const start = new Date();

    if (range === "week") start.setDate(today.getDate() - 6);
    else if (range === "month") start.setDate(today.getDate() - 29);
    // 6-month/year are bucketed per month, so their window starts at the
    // first of the oldest month shown rather than a rolling day count.
    else start.setFullYear(today.getFullYear(), today.getMonth() - (range === "sixMonth" ? 5 : 11), 1);

    return `${formatGregorianShort(start)} – ${formatGregorianShort(today)}`;
  }, [range]);

  // Sized from the real data only, so the target line (which can sit far
  // from it) never drags the resolution down around the actual trend —
  // extended afterward, separately, just enough to fit the target in too.
  const axisRows = chartType === "bar" ? BAR_Y_AXIS_ROWS : Y_AXIS_ROWS;
  const dataValues = chartPoints.map((p) => p.value ?? NaN);

  let yAxis =
    chartType === "bar"
      ? computeZeroBasedYAxisRange(dataValues, axisRows, minYStep)
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
        backgroundColor: color,
        hoverBackgroundColor: color,
        borderRadius: 4,
        // Rounds the top corners only; a bar sitting on the baseline
        // shouldn't have its bottom edge rounded away from it.
        borderSkipped: "bottom" as const,
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
          autoSkip: true,
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

          <button
            onClick={onAdd}
            aria-label={addLabel}
            className="glass-chip absolute left-0 flex h-9 w-9 items-center justify-center rounded-full text-avocado-yellow"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="glass-chip relative mt-3 flex items-center justify-around rounded-full p-1">
          {RANGES.map((r) => (
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

        <div className="mt-3">
          <p className="text-xs text-white/50">{summaryLabel}</p>
          <p className="text-white">
            <span className="text-2xl font-bold">
              {summaryValue !== null ? toFaDigits(summaryValue.toFixed(valuePrecision)) : "—"}
            </span>{" "}
            <span className="text-sm text-white/60">{unitLabel}</span>
          </p>
          <p className="text-xs text-white/50">{dateRangeLabel}</p>
        </div>

        {/* overflow-hidden: if the canvas is ever transiently mis-sized
            (the stale-viewport case useChartResizeOnViewportSettle exists
            for), it clips inside the panel instead of painting past the
            screen edge until the next resize signal lands. */}
        <div className="relative mt-2 min-h-0 flex-1 overflow-hidden">
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
