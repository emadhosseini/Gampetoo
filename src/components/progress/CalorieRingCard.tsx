import { getCalorieTarget, getTodaysTotalCalories } from "@/utils/dailyLogEngine";
import { toFaDigits } from "@/utils/numberFormat";

// Status zones for today's intake as a percentage of the calorie target.
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

// The progress page's daily-calories card: a compact square tile (it
// shares a row with the weight tile) holding a circular progress ring
// with today's total in the hollow and the intake status named and
// colored underneath. No title line and no percentage bar — the tile is
// half-width now, and the detail page behind the tap is where the full
// breakdown lives. Without a calorie target there's no honest percentage,
// so the ring stays neutral rather than showing a fabricated status.
export default function CalorieRingCard({ onClick }: CalorieRingCardProps) {
  const calories = getTodaysTotalCalories();
  const target = getCalorieTarget();

  const pct = target !== null && target > 0 ? (calories / target) * 100 : null;
  const zone = pct !== null ? ZONES.find((z) => pct <= z.to)! : null;

  // The arc caps at a full lap; going over target is conveyed by the
  // status word rather than by an overflowing ring.
  const ringFraction = pct !== null ? Math.min(pct, 100) / 100 : 0;
  const dotAngle = ringFraction * 2 * Math.PI - Math.PI / 2;

  return (
    <button
      onClick={onClick}
      className="glass-panel flex w-full flex-col justify-center rounded-2xl p-4"
    >
      <div className="relative mx-auto aspect-square w-full max-w-32">
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
                  when nothing's logged yet. */}
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
          <span className="text-lg leading-none">🍽️</span>
          <span className="mt-1 text-2xl font-bold leading-tight text-white">
            {toFaDigits(calories)}
          </span>
          <span className="text-xs text-white/60">کالری</span>
        </div>
      </div>

      {zone !== null ? (
        <p
          className="mt-2 text-center text-sm font-semibold"
          style={{ color: zone.color }}
        >
          {zone.label}
        </p>
      ) : (
        <p className="mt-2 text-center text-xs leading-5 text-white/50">
          کالری هدف رو ثبت کن
        </p>
      )}
    </button>
  );
}
