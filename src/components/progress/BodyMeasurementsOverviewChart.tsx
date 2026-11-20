import { useMemo, useState } from "react";
import { motion } from "framer-motion";

import {
  MEASUREMENT_COLORS,
  MEASUREMENT_LABELS,
  MEASUREMENT_TYPES,
  type MeasurementEntry,
  type MeasurementType,
} from "@/utils/bodyMeasurementsEngine";
import { buildDailyBuckets, buildMonthlyBuckets } from "@/utils/statBuckets";
import { computeYAxisRange } from "@/utils/chartAxis";
import { toFaDigits } from "@/utils/numberFormat";
import type { DailyMetricEntry } from "@/utils/dailyMetricLog";

type OverviewRange = "month" | "sixMonth" | "year";

const RANGES: { key: OverviewRange; label: string }[] = [
  { key: "month", label: "ماه" },
  { key: "sixMonth", label: "۶ ماه" },
  { key: "year", label: "سال" },
];

// Weight lives in this chart too (as a series alongside the eight body
// measurements) even though it's tracked by its own engine — a "weight"
// pseudo-key alongside the real MeasurementType keys, so the legend/toggle
// logic below doesn't need two separate code paths for one extra line.
type SeriesKey = MeasurementType | "weight";

const WEIGHT_KEY: SeriesKey = "weight";
const WEIGHT_COLOR = "#C084FC"; // same purple WeightChart itself uses.
const WEIGHT_LABEL = "وزن";

const SERIES_KEYS: SeriesKey[] = [WEIGHT_KEY, ...MEASUREMENT_TYPES];
const SERIES_LABELS: Record<SeriesKey, string> = { weight: WEIGHT_LABEL, ...MEASUREMENT_LABELS };
const SERIES_COLORS: Record<SeriesKey, string> = { weight: WEIGHT_COLOR, ...MEASUREMENT_COLORS };

// Fixed logical canvas the SVG scales to its container's real width —
// avoids the ResizeObserver machinery WeightChart needs, at the cost of
// text scaling along with everything else. Fine for a secondary summary
// chart; the per-metric detail pages (StatChartPage) are where precise,
// device-pixel-sized axes actually matter.
const VIEW_WIDTH = 343;
const VIEW_HEIGHT = 200;
const PADDING = { top: 14, right: 34, bottom: 20, left: 8 };
const Y_AXIS_ROWS = 5;

export interface BodyMeasurementsOverviewChartProps {
  entries: MeasurementEntry[];
  /** Weight log, already flattened to a plain date/value series. */
  weightEntries: { date: string; value: number }[];
}

/**
 * Weight plus all eight measurement types on one chart, as percent change
 * from each one's own first logged value inside the visible range — not
 * absolute values, which span too wide a range to share a Y axis (a 19cm
 * wrist, a 107cm waist, and a 98kg weight on the same linear scale flattens
 * the smaller ones to nothing). Percent change makes every line comparable
 * regardless of the metric's own scale, and re-baselines to whichever
 * window is selected, so "the last 6 months" always reads as change over
 * those 6 months specifically.
 *
 * No "week" range — a week is too short for a circumference measurement to
 * show a meaningful change, so it isn't offered here (the per-metric detail
 * pages drop it for the same reason).
 *
 * The legend doubles as the metric picker: tapping a chip toggles that
 * metric's line on/off instead of a separate checkbox list. Every metric,
 * weight included, starts selected.
 */
export default function BodyMeasurementsOverviewChart({
  entries,
  weightEntries,
}: BodyMeasurementsOverviewChartProps) {
  const [range, setRange] = useState<OverviewRange>("month");
  const [selected, setSelected] = useState<Set<SeriesKey>>(() => new Set(SERIES_KEYS));

  function toggle(key: SeriesKey) {
    setSelected((prev) => {
      const next = new Set(prev);

      if (next.has(key)) next.delete(key);
      else next.add(key);

      return next;
    });
  }

  // One percent-change series per metric (including weight), bucketed the
  // same way the per-metric detail charts are (day/month buckets, "gap" for
  // a day with nothing logged) so this reads as the same underlying data,
  // just normalized and overlaid.
  const series = useMemo(() => {
    return SERIES_KEYS.map((key) => {
      const history: DailyMetricEntry[] =
        key === "weight"
          ? weightEntries
          : entries
              .filter((entry) => entry.values[key] !== undefined)
              .map((entry) => ({ date: entry.date, value: entry.values[key] as number }));

      const buckets =
        range === "month"
          ? buildDailyBuckets(history, 30, "gap")
          : buildMonthlyBuckets(history, range === "sixMonth" ? 6 : 12, "gap");

      const baselineIndex = buckets.findIndex((b) => b.value !== null);
      const baseline = baselineIndex >= 0 ? (buckets[baselineIndex].value as number) : null;

      const points =
        baseline === null || baseline === 0
          ? buckets.map(() => null)
          : buckets.map((b) => (b.value === null ? null : ((b.value - baseline) / baseline) * 100));

      return { key, labels: buckets.map((b) => b.label), points, hasData: baseline !== null };
    });
  }, [entries, weightEntries, range]);

  const labels = series[0]?.labels ?? [];

  const activeSeries = series.filter((s) => selected.has(s.key) && s.hasData);

  const allValues = activeSeries.flatMap((s) => s.points.filter((v): v is number => v !== null));
  const axis = computeYAxisRange([...allValues, 0], Y_AXIS_ROWS, 5);

  const plotLeft = PADDING.left;
  const plotRight = VIEW_WIDTH - PADDING.right;
  const plotTop = PADDING.top;
  const plotBottom = VIEW_HEIGHT - PADDING.bottom;
  const plotWidth = Math.max(0, plotRight - plotLeft);
  const plotHeight = Math.max(0, plotBottom - plotTop);

  function xFor(index: number) {
    if (labels.length <= 1) return plotLeft + plotWidth / 2;

    return plotLeft + (index / (labels.length - 1)) * plotWidth;
  }

  function yFor(value: number) {
    if (axis.max === axis.min) return plotTop + plotHeight / 2;

    return plotBottom - ((value - axis.min) / (axis.max - axis.min)) * plotHeight;
  }

  const gridValues: number[] = [];
  for (let v = axis.min; v <= axis.max + 1e-9; v += axis.stepSize) {
    gridValues.push(Math.round(v * 100) / 100);
  }

  const hasAnyData = activeSeries.length > 0;

  const labelStride = labels.length <= 7 ? 1 : Math.max(1, Math.ceil(labels.length / 6));
  const labelIndexes = labels.map((_, i) => i).filter((i) => i % labelStride === 0);

  return (
    <div className="glass-panel glass-static space-y-3 rounded-2xl p-4">
      <h2 className="text-center text-sm font-semibold text-white/70">نمای کلی اندازه‌ها</h2>

      <div className="glass-chip relative flex items-center justify-around rounded-full p-1">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className="relative z-10 flex-1 py-1.5 text-center text-xs font-medium text-white [-webkit-tap-highlight-color:transparent]"
          >
            {range === r.key && (
              <motion.div
                layoutId="overview-range-selection"
                className="absolute inset-0 -z-10 rounded-full bg-white/15"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            {r.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          className="w-full overflow-visible"
          style={{ direction: "ltr" }}
        >
          {gridValues.map((value) => (
            <g key={value}>
              <line
                x1={plotLeft}
                y1={yFor(value)}
                x2={plotRight}
                y2={yFor(value)}
                stroke={value === 0 ? "rgb(255 255 255 / 25%)" : "rgb(255 255 255 / 10%)"}
                strokeWidth={1}
              />
              <text
                x={VIEW_WIDTH - 2}
                y={yFor(value)}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={9}
                fontFamily="Vazirmatn"
                fill="rgb(255 255 255 / 55%)"
              >
                {`${value > 0 ? "+" : ""}${toFaDigits(value)}٪`}
              </text>
            </g>
          ))}

          {activeSeries.map((s) => {
            const readings = s.points
              .map((value, index) => ({ index, value }))
              .filter((p): p is { index: number; value: number } => p.value !== null);

            if (readings.length === 0) return null;

            const path =
              readings.length > 1
                ? readings
                    .map(
                      (r, i) =>
                        `${i === 0 ? "M" : "L"} ${xFor(r.index).toFixed(2)} ${yFor(r.value).toFixed(2)}`,
                    )
                    .join(" ")
                : null;

            const color = SERIES_COLORS[s.key];

            return (
              <g key={s.key}>
                {path && (
                  <path
                    d={path}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                {readings.map((r) => (
                  <circle
                    key={r.index}
                    cx={xFor(r.index)}
                    cy={yFor(r.value)}
                    r={3}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                  />
                ))}
              </g>
            );
          })}

          {labelIndexes.map((index) => (
            <text
              key={index}
              x={xFor(index)}
              y={VIEW_HEIGHT - 4}
              textAnchor="middle"
              fontSize={9}
              fontFamily="Vazirmatn"
              fill="rgb(255 255 255 / 55%)"
            >
              {labels[index]}
            </text>
          ))}
        </svg>

        {!hasAnyData && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-white/50">چیزی ثبت نشده</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {SERIES_KEYS.map((key) => {
          const active = selected.has(key);
          const color = SERIES_COLORS[key];

          return (
            <button
              key={key}
              onClick={() => toggle(key)}
              className="glass-chip flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
              style={{ color: active ? "#ffffff" : "rgb(255 255 255 / 40%)" }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: active ? color : "rgb(255 255 255 / 25%)" }}
              />
              {SERIES_LABELS[key]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
