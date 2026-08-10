import { useLayoutEffect, useMemo, useRef, useState } from "react";

import ModalOverlay from "@/components/ModalOverlay";
import { getExerciseHistory } from "@/utils/exerciseSetLogEngine";
import { computeWeightAxis } from "@/utils/weightChartAxis";
import { formatDisplayDayNumber, isoToLocalDate, toLocalDateString } from "@/utils/dateFormat";
import { toFaDigits } from "@/utils/numberFormat";

const LINE_COLOR = "#C084FC";
const LINE_WIDTH = 2.5;
const POINT_RADIUS = 4;
const PADDING = { top: 14, right: 42, bottom: 26, left: 10 };
const MAX_X_LABELS = 6;

type Range = "1m" | "3m" | "all";

const RANGES: { key: Range; label: string; days: number | null }[] = [
  { key: "1m", label: "۱ ماه", days: 30 },
  { key: "3m", label: "۳ ماه", days: 90 },
  { key: "all", label: "کل", days: null },
];

export interface ExerciseProgressChartModalProps {
  open: boolean;
  onClose: () => void;
  exerciseId: string;
  exerciseName: string;
}

// The line drawn is the heaviest confirmed weight lifted that session, not
// the estimated 1RM — a real measured number beats an estimate wherever
// both are available, and getExerciseHistory computes both so this could
// switch with a one-line change if that's ever wanted instead.
export default function ExerciseProgressChartModal({
  open,
  onClose,
  exerciseId,
  exerciseName,
}: ExerciseProgressChartModalProps) {
  const [range, setRange] = useState<Range>("3m");
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    function measure() {
      const rect = containerRef.current?.getBoundingClientRect();

      if (rect) setSize({ width: rect.width, height: rect.height });
    }

    measure();

    const observer = new ResizeObserver(measure);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [open]);

  // All-time, regardless of the selected range — "بیشترین وزنه" and total
  // volume are career stats for this exercise, not scoped to whatever
  // window the chart above happens to be zoomed to.
  const fullHistory = useMemo(
    () => (open ? getExerciseHistory(exerciseId) : []),
    [open, exerciseId],
  );

  const activeRangeDays = RANGES.find((r) => r.key === range)!.days;

  const points = useMemo(() => {
    if (activeRangeDays === null) return fullHistory;

    const cutoff = toLocalDateString(
      new Date(Date.now() - activeRangeDays * 86400000),
    );

    return fullHistory.filter((p) => p.date >= cutoff);
  }, [fullHistory, activeRangeDays]);

  if (!open) {
    return null;
  }

  const maxWeight =
    fullHistory.length > 0 ? Math.max(...fullHistory.map((p) => p.heaviestWeight)) : null;
  const totalVolume = fullHistory.reduce((sum, p) => sum + p.volume, 0);

  const { width, height } = size;
  const ready = width > 0 && height > 0 && points.length > 0;
  const axis = ready ? computeWeightAxis(points.map((p) => p.heaviestWeight)) : null;

  const plotLeft = PADDING.left;
  const plotRight = width - PADDING.right;
  const plotTop = PADDING.top;
  const plotBottom = height - PADDING.bottom;
  const plotWidth = Math.max(0, plotRight - plotLeft);
  const plotHeight = Math.max(0, plotBottom - plotTop);

  function xFor(index: number): number {
    if (points.length <= 1) return plotLeft + plotWidth / 2;

    return plotLeft + (index / (points.length - 1)) * plotWidth;
  }

  function yFor(value: number): number {
    if (!axis || axis.max === axis.min) return plotTop + plotHeight / 2;

    return plotBottom - ((value - axis.min) / (axis.max - axis.min)) * plotHeight;
  }

  const gridValues: number[] = [];
  if (axis) {
    for (let v = axis.min; v <= axis.max + 1e-9; v += axis.step) {
      gridValues.push(Math.round(v * 100) / 100);
    }
  }

  const labelStride = Math.max(1, Math.ceil(points.length / MAX_X_LABELS));
  const labelIndexes = points.map((_, i) => i).filter((i) => i % labelStride === 0);

  const linePath =
    points.length > 1
      ? points
          .map(
            (p, i) =>
              `${i === 0 ? "M" : "L"} ${xFor(i).toFixed(2)} ${yFor(p.heaviestWeight).toFixed(2)}`,
          )
          .join(" ")
      : null;

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-panel glass-static max-h-[85vh] space-y-4 overflow-y-auto rounded-3xl p-6">
        <h2 className="text-center text-lg font-bold text-white">
          نمودار پیشرفت {exerciseName}
        </h2>

        <div className="glass-chip glass-static relative flex items-center justify-around rounded-full p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`relative z-10 flex-1 rounded-full py-1.5 text-center text-xs font-medium transition-colors ${
                range === r.key ? "bg-white/15 text-white" : "text-white/60"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div ref={containerRef} className="relative h-56 w-full">
          {ready && axis ? (
            <svg
              width={width}
              height={height}
              className="overflow-visible"
              style={{ direction: "ltr" }}
            >
              {gridValues.map((value) => (
                <g key={value}>
                  <line
                    x1={plotLeft}
                    y1={yFor(value)}
                    x2={plotRight}
                    y2={yFor(value)}
                    stroke="rgb(255 255 255 / 12%)"
                    strokeWidth={1}
                  />

                  <text
                    x={width - 4}
                    y={yFor(value)}
                    textAnchor="end"
                    dominantBaseline="middle"
                    fontSize={10}
                    fontFamily="Vazirmatn"
                    fill="rgb(255 255 255 / 55%)"
                  >
                    {toFaDigits(value)}
                  </text>
                </g>
              ))}

              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke={LINE_COLOR}
                  strokeWidth={LINE_WIDTH}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {points.map((p, i) => (
                <circle
                  key={p.date}
                  cx={xFor(i)}
                  cy={yFor(p.heaviestWeight)}
                  r={POINT_RADIUS}
                  fill="none"
                  stroke={LINE_COLOR}
                  strokeWidth={LINE_WIDTH}
                />
              ))}

              {labelIndexes.map((i) => (
                <text
                  key={`x-${i}`}
                  x={xFor(i)}
                  y={height - 8}
                  textAnchor="middle"
                  fontSize={10}
                  fontFamily="Vazirmatn"
                  fill="rgb(255 255 255 / 55%)"
                >
                  {formatDisplayDayNumber(isoToLocalDate(points[i].date))}
                </text>
              ))}
            </svg>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-white/50">هنوز داده‌ای برای این بازه ثبت نشده</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="glass-chip glass-static rounded-2xl p-3 text-center">
            <p className="text-xs text-white/60">بیشترین وزنه</p>
            <p className="mt-1 text-lg font-bold text-white">
              {maxWeight !== null ? `${toFaDigits(maxWeight)}kg` : "—"}
            </p>
          </div>

          <div className="glass-chip glass-static rounded-2xl p-3 text-center">
            <p className="text-xs text-white/60">مجموع حجم جابه‌جا‌شده</p>
            <p className="mt-1 text-lg font-bold text-white">
              {toFaDigits(totalVolume)}kg
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="ghost-action ghost-action-static w-full rounded-2xl py-3 font-medium text-white"
        >
          بستن
        </button>
      </div>
    </ModalOverlay>
  );
}
