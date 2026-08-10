import { Sparkles } from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

import type { RadarStrengthPoint, StrengthLevelInfo } from "@/domain/services/strengthCalculator";
import { toFaDigits } from "@/utils/numberFormat";

// Neon purple, at low fill opacity so the grid still reads through it —
// matches the weight chart's own accent color elsewhere in this app,
// rather than introducing a fourth accent hue into the palette.
const RADAR_COLOR = "#C084FC";
const GRID_COLOR = "#3f3f46";

export interface OverallStrengthRadarProps {
  chartData: RadarStrengthPoint[];
  totalScore: number;
  maxScore: number;
  level: StrengthLevelInfo;
  insight: string;
}

type AngleAxisTickProps = {
  x?: number | string;
  y?: number | string;
  textAnchor?: "inherit" | "end" | "start" | "middle";
  payload?: { value: string };
};

// Purely presentational — no calculation happens here, only data -> pixels.
// The category averaging/percentages, total/max score, level tier (and
// its progress-bar percentage), and the insight sentence itself all come
// from utils/strengthStatsEngine.ts (which in turn only ever calls the
// pure domain/services/strengthCalculator.ts functions) — this component
// just renders whatever numbers/strings it's handed.
export default function OverallStrengthRadar({
  chartData,
  totalScore,
  maxScore,
  level,
  insight,
}: OverallStrengthRadarProps) {
  // PolarAngleAxis's `tick` prop only ever receives the axis value itself
  // (the subject string, via payload.value) — not the row's other
  // fields — so this looks its matching point up from chartData (closed
  // over here, not re-passed as a prop) purely to read its
  // already-computed `percentage` (never recalculated in this
  // component). x/y/textAnchor come straight from recharts' own
  // placement math for this spoke's label, unchanged from what the
  // default tick would have used.
  function renderAngleAxisTick({ x, y, textAnchor, payload }: AngleAxisTickProps) {
    if (x === undefined || y === undefined || !payload) return <g />;

    const point = chartData.find((p) => p.subject === payload.value);
    const label = point ? `${payload.value} ${toFaDigits(point.percentage)}٪` : payload.value;

    return (
      <text x={x} y={y} textAnchor={textAnchor} fill="#ffffff" fontSize={12} fontFamily="Vazirmatn">
        {label}
      </text>
    );
  }

  return (
    <div>
      <div className="text-center">
        {/* dir="ltr" forces the fraction to always read smaller-number-
            left, bigger-number-right (the universal "X of Y" convention)
            regardless of the page's own RTL direction, which would
            otherwise flip which side each number lands on. */}
        <p dir="ltr" className="text-3xl font-extrabold text-white">
          {toFaDigits(totalScore)}{" "}
          <span className="text-lg font-semibold text-white/40">/ {toFaDigits(maxScore)}</span>
        </p>
        <p className="text-xs text-white/50">مجموع امتیاز قدرت</p>

        {/* The gamification badge — level name/emoji only, entirely
            decided by getStrengthLevel (domain layer). */}
        <div className="glass-chip glass-static mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold text-white">
          <span>{level.levelEmoji}</span>
          <span>سطح {level.levelName}</span>
        </div>

        {level.nextLevelName && (
          <>
            <p className="mt-1 text-xs text-zinc-400">
              فقط {toFaDigits(level.pointsToNextLevel)} امتیاز تا سطح {level.nextLevelName} فاصله
              داری!
            </p>

            {/* Width is levelProgressPercentage, straight from the domain
                layer — nothing computed here beyond turning a number into
                a CSS width. dir="ltr" so the fill grows from the left
                (empty -> full reading left-to-right) instead of the
                right, which is what a bare width on an RTL element would
                otherwise do. */}
            <div
              dir="ltr"
              className="mx-auto mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-zinc-800"
            >
              <div
                className="h-full rounded-full bg-avocado-lime transition-[width] duration-500"
                style={{ width: `${level.levelProgressPercentage}%` }}
              />
            </div>
          </>
        )}
      </div>

      {/* Was h-80 with a big mt-4 — a fixed 320px box around a small
          centered triangle (outerRadius 70%, often near-empty at 0%) left
          a lot of dead space above and below it before the top spoke
          label and after the bottom two, independent of how tall the
          actual triangle happened to be. Shrinking the box itself is what
          removes that space, since ResponsiveContainer always fills
          whatever height it's given regardless of the data. */}
      <div className="mt-2 h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData} outerRadius="70%">
            <PolarGrid stroke={GRID_COLOR} />

            <PolarAngleAxis dataKey="subject" tick={renderAngleAxisTick} />

            <PolarRadiusAxis
              angle={90}
              domain={[0, "dataMax"]}
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
              axisLine={false}
            />

            <Radar
              dataKey="A"
              stroke={RADAR_COLOR}
              fill={RADAR_COLOR}
              fillOpacity={0.35}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Smart-insight card — same shape as every other nested card in
          this app (glass-chip inside the outer glass-panel), so it reads
          as part of the same design system rather than a one-off box. No
          top margin — sits flush under the chart now, for a more compact
          card overall. */}
      <div className="glass-chip glass-static space-y-2 rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-avocado-yellow" />
          <span className="text-sm font-semibold text-white">تحلیل هوشمند گامپتو</span>
        </div>

        <p className="text-sm leading-7 text-white/80">{insight}</p>
      </div>
    </div>
  );
}
