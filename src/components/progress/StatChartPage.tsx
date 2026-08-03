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
import { computeYAxisRange } from "@/utils/chartAxis";
import { formatGregorianShort } from "@/utils/dateFormat";
import { toFaDigits } from "@/utils/numberFormat";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

const CHART_FONT_FAMILY = "Vazirmatn";

type RangeKey = "day" | "week" | "month" | "sixMonth" | "year";

const RANGES: { key: RangeKey; label: string; days: number }[] = [
  { key: "day", label: "روز", days: 7 },
  { key: "week", label: "هفته", days: 30 },
  { key: "month", label: "ماه", days: 90 },
  { key: "sixMonth", label: "۶ ماه", days: 180 },
  { key: "year", label: "سال", days: 365 },
];

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
  children,
}: StatChartPageProps) {
  const navigate = useNavigate();
  const [range, setRange] = useState<RangeKey>("month");

  const activeRange = RANGES.find((r) => r.key === range)!;

  const entries = useMemo(() => {
    const cutoff = daysAgoIso(activeRange.days);

    return history
      .filter((entry) => entry.date >= cutoff)
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [history, activeRange.days]);

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

  const yAxis = computeYAxisRange(
    entries.map((e) => e.value),
    3,
    minYStep,
  );

  const chartData = {
    labels: entries.map((entry) => formatGregorianShort(isoToLocalDate(entry.date))),
    datasets: [
      {
        data: entries.map((entry) => entry.value),
        borderColor: color,
        backgroundColor: `${color}26`,
        pointBackgroundColor: color,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: { color: "#ffffff", font: { family: CHART_FONT_FAMILY, size: 10 } },
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
          label: (context: TooltipItem<"line">) =>
            `${toFaDigits((context.parsed.y ?? 0).toFixed(valuePrecision))} ${unitLabel}`,
        },
      },
    },
  };

  return (
    <div>
      {/* Flush to the very top of the safe area, ~1/3 of the screen —
          the reference design this was built from. Rounded on the bottom
          only, since it's pinned to the top edge. */}
      <div
        className="glass-panel flex h-[33dvh] min-h-[230px] flex-col rounded-b-3xl rounded-t-none px-5 pb-3 pt-safe"
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

        <div className="mt-2 min-h-0 flex-1">
          {entries.length > 0 ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-white/50">چیزی ثبت نشده</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4 px-5 pb-5 pt-4">{children}</div>
    </div>
  );
}
