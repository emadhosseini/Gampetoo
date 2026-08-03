import { useMemo, useState, type ReactNode } from "react";
import { ChevronRight, Plus } from "lucide-react";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type TooltipItem,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import type { DailyMetricEntry } from "@/utils/dailyMetricLog";
import { computeYAxisRange, extendYAxisRangeToInclude } from "@/utils/chartAxis";
import { formatDayNumber, formatGregorianShort } from "@/utils/dateFormat";
import { toFaDigits } from "@/utils/numberFormat";
import { buildDailyBuckets, buildMonthlyBuckets, type StatBucket } from "@/utils/statBuckets";

// Rows the Y-axis always shows, regardless of range — never fewer, so a
// single point (or a flat week) never collapses onto the bottom edge.
const Y_AXIS_ROWS = 4;

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

const CHART_FONT_FAMILY = "Vazirmatn";

type RangeKey = "day" | "week" | "month" | "sixMonth" | "year";

const RANGES: { key: RangeKey; label: string; days: number }[] = [
  { key: "day", label: "روز", days: 0 },
  { key: "week", label: "هفته", days: 7 },
  { key: "month", label: "ماه", days: 30 },
  { key: "sixMonth", label: "۶ ماه", days: 180 },
  { key: "year", label: "سال", days: 365 },
];

// The ranges that compress into aggregated buckets (month's 30 daily
// buckets, year's 12 monthly averages) rather than just plotting real
// entries directly — gated behind `bucketingReady` for stats that don't
// have this figured out for their own unit yet (water/activity).
const COMPRESSED_RANGES: RangeKey[] = ["month", "year"];

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
  // Whether the month/year "compressed" bucketing (see COMPRESSED_RANGES)
  // is ready for this stat's unit — off for water/activity, which show a
  // "coming soon" placeholder on those two ranges instead of a half-baked
  // aggregation. Defaults to true (weight/calories).
  bucketingReady?: boolean;
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
  bucketingReady = true,
  children,
}: StatChartPageProps) {
  const navigate = useNavigate();
  const [range, setRange] = useState<RangeKey>("month");

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
  // wherever the sparse data happens to sit) and year aggregates into one
  // bucket per month so ~365 daily points compress into 12. Day/6-month
  // just plot the real entries directly.
  const chartPoints: StatBucket[] = useMemo(() => {
    if (range === "week") return buildDailyBuckets(history, 7);
    if (range === "month") return buildDailyBuckets(history, 30);
    if (range === "year") return buildMonthlyBuckets(history, 12);

    return entries.map((entry) => ({
      label: formatDayNumber(isoToLocalDate(entry.date)),
      value: entry.value,
    }));
  }, [range, history, entries]);

  const hasData = chartPoints.some((point) => point.value !== null);
  const isComingSoon = !bucketingReady && COMPRESSED_RANGES.includes(range);

  const average =
    entries.length > 0
      ? entries.reduce((sum, entry) => sum + entry.value, 0) / entries.length
      : null;

  const dateRangeLabel =
    entries.length > 0
      ? entries.length === 1
        ? formatGregorianShort(isoToLocalDate(entries[0].date))
        : `${formatGregorianShort(isoToLocalDate(entries[0].date))} – ${formatGregorianShort(isoToLocalDate(entries[entries.length - 1].date))}`
      : "—";

  // Sized from the real data only, so the target line (which can sit far
  // from it) never drags the resolution down around the actual trend —
  // extended afterward, separately, just enough to fit the target in too.
  let yAxis = computeYAxisRange(
    chartPoints.map((p) => p.value ?? NaN),
    Y_AXIS_ROWS,
    minYStep,
  );

  if (targetValue !== undefined) {
    yAxis = extendYAxisRangeToInclude(yAxis, targetValue);
  }

  // Denser buckets (month's 30 days) get smaller points so they don't
  // visually collide into each other.
  const pointRadius = range === "month" ? 2 : 3;

  const chartData = {
    labels: chartPoints.map((point) => point.label),
    datasets: [
      {
        data: chartPoints.map((point) => point.value),
        spanGaps: false,
        borderColor: color,
        backgroundColor: `${color}26`,
        pointBackgroundColor: color,
        pointRadius,
        pointHoverRadius: pointRadius + 2,
        tension: 0.3,
        fill: true,
      },
      ...(targetValue !== undefined
        ? [
            {
              label: targetLabel,
              data: chartPoints.map(() => targetValue),
              borderColor: "#f87171",
              borderDash: [6, 4],
              borderWidth: 1.5,
              pointRadius: 0,
              pointHoverRadius: 0,
              fill: false,
              tension: 0,
            },
          ]
        : []),
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
          label: (context: TooltipItem<"line">) => {
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
          <p className="text-xs text-white/50">میانگین</p>
          <p className="text-white">
            <span className="text-2xl font-bold">
              {average !== null ? toFaDigits(average.toFixed(valuePrecision)) : "—"}
            </span>{" "}
            <span className="text-sm text-white/60">{unitLabel}</span>
          </p>
          <p className="text-xs text-white/50">{dateRangeLabel}</p>
        </div>

        <div className="relative mt-2 min-h-0 flex-1">
          {isComingSoon ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-white/50">به زودی این قابلیت اضافه می‌شه</p>
            </div>
          ) : (
            <>
              <Line data={chartData} options={chartOptions} />

              {!hasData && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-sm text-white/50">چیزی ثبت نشده</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="space-y-4 px-5 pb-5 pt-4">{children}</div>
    </div>
  );
}
