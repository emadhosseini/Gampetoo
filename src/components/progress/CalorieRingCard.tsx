import { getCalorieTarget, getTodaysTotalCalories } from "@/utils/dailyLogEngine";
import { toFaDigits } from "@/utils/numberFormat";

// Status zones for today's intake as a percentage of the calorie target.
// The bar maps 0–150% across three equal segments (like the reference
// design's three-segment bar), so the over-target zone has real room to
// point into instead of pinning at the end.
const BAR_MAX_PCT = 150;

const ZONES = [
  { to: 50, label: "کمتر از نیاز", color: "#fbbf24" },
  { to: 100, label: "مناسب", color: "#4ade80" },
  { to: Infinity, label: "بیشتر از هدف", color: "#f87171" },
];

// Ring geometry: viewBox 100x100, stroked circle.
const RING_R = 44;
const RING_C = 2 * Math.PI * RING_R;

export interface CalorieRingCardProps {
  onClick: () => void;
}

// The progress page's daily-calories card, styled after a Health-style
// ring + status bar (user-provided reference): a circular progress ring
// with today's total in the hollow, and beside it a colored status word
// with a three-segment bar whose pointer marks today's intake as a
// percentage of the calorie target. Without a target there's no honest
// percentage to show, so the ring stays neutral and the bar is replaced
// by a hint to set one — never a fabricated status.
export default function CalorieRingCard({ onClick }: CalorieRingCardProps) {
  const calories = getTodaysTotalCalories();
  const target = getCalorieTarget();

  const pct = target !== null && target > 0 ? (calories / target) * 100 : null;
  const zone = pct !== null ? ZONES.find((z) => pct <= z.to)! : null;

  // Ring arc caps at a full lap; the bar (which has a real over-target
  // zone) is what shows anything beyond 100%.
  const ringFraction = pct !== null ? Math.min(pct, 100) / 100 : 0;
  const dotAngle = ringFraction * 2 * Math.PI - Math.PI / 2;
  const barPct = pct !== null ? (Math.min(pct, BAR_MAX_PCT) / BAR_MAX_PCT) * 100 : 0;

  return (
    <button
      onClick={onClick}
      className="glass-panel w-full rounded-2xl p-5 text-right"
    >
      <h2 className="text-lg font-semibold text-white">کالری روزانه</h2>
      <p className="text-sm text-white/60">
        {target !== null ? `کالری هدف: ${toFaDigits(target)}` : "بدون هدف"}
      </p>

      <div className="mt-4 flex items-center gap-5">
        <div className="relative h-28 w-28 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full">
            <circle
              cx="50"
              cy="50"
              r={RING_R}
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="7"
            />

            {zone !== null && (
              <>
                {ringFraction > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r={RING_R}
                    fill="none"
                    stroke={zone.color}
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={RING_C}
                    strokeDashoffset={RING_C * (1 - ringFraction)}
                    transform="rotate(-90 50 50)"
                  />
                )}

                {/* Position marker at the arc's end — sits at 12 o'clock
                    when nothing's logged yet, like the reference. */}
                <circle
                  cx={50 + RING_R * Math.cos(dotAngle)}
                  cy={50 + RING_R * Math.sin(dotAngle)}
                  r="4.5"
                  fill={zone.color}
                />
              </>
            )}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl">🍽️</span>
            <span className="text-2xl font-bold text-white">
              {toFaDigits(calories)}
            </span>
          </div>
        </div>

        {zone !== null ? (
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white/60">
              وضعیت مصرف{" "}
              <span className="text-lg font-bold" style={{ color: zone.color }}>
                {zone.label}
              </span>
            </p>

            <div className="relative mt-4">
              <div className="flex gap-1">
                {ZONES.map((z) => (
                  <div
                    key={z.label}
                    className="h-2 flex-1 overflow-hidden rounded-full bg-white/15"
                  >
                    {/* Per-segment fill: a plain block div starts at the
                        inline-start (right, in RTL) edge, so the bar fills
                        right-to-left to match the app's reading direction. */}
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, Math.max(0, (barPct - (ZONES.indexOf(z) * 100) / 3) / (100 / 3) * 100))}%`,
                        backgroundColor: zone.color,
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Pointer riding above the bar at today's position. */}
              <div
                className="absolute -top-2.5 h-0 w-0 translate-x-1/2 border-x-[6px] border-t-[7px] border-x-transparent"
                style={{ right: `${barPct}%`, borderTopColor: zone.color }}
              />

              <div className="relative mt-1 h-4 text-xs text-white/60">
                <span className="absolute translate-x-1/2" style={{ right: "33.33%" }}>
                  ۵۰٪
                </span>
                <span className="absolute translate-x-1/2" style={{ right: "66.66%" }}>
                  ۱۰۰٪
                </span>
              </div>
            </div>
          </div>
        ) : (
          <p className="min-w-0 flex-1 text-sm text-white/50">
            برای نمایش وضعیت، کالری هدف رو از صفحه‌ی جزئیات کالری تنظیم کن
          </p>
        )}
      </div>
    </button>
  );
}
