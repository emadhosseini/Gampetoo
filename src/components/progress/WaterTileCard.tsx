import { getTodayGlasses, getWaterGoal } from "@/utils/waterEngine";
import { toFaDigits } from "@/utils/numberFormat";

const WATER_COLOR = "#38bdf8";

export interface WaterTileCardProps {
  onClick: () => void;
}

// The progress page's water tile: a glass drawn as an SVG that literally
// fills to today's share of the goal, with the count underneath — the
// same square shape as the weight/calorie tiles it shares the grid with.
// A glass filling up is the whole idea of the feature, so the tile shows
// exactly that rather than a number in a ring.
export default function WaterTileCard({ onClick }: WaterTileCardProps) {
  const glasses = getTodayGlasses();
  const goal = getWaterGoal();

  const fill = Math.min(1, goal > 0 ? glasses / goal : 0);

  // Glass body spans y=14 (rim) to y=86 (base) in the 100x100 viewBox;
  // the water surface rises from the base as `fill` grows.
  const waterTop = 86 - fill * 72;

  return (
    <button
      onClick={onClick}
      className="glass-panel flex w-full flex-col justify-center rounded-2xl p-4"
    >
      {/* Count sits below the glass, not inside it: overlaying it put the
          text right on the waterline, where white-on-light-blue stopped
          being readable at exactly the fill levels people hit most. */}
      <div className="mx-auto flex aspect-square w-full max-w-32 flex-col items-center justify-center">
        <svg viewBox="0 0 100 100" className="h-16 w-16">
          <defs>
            {/* Clips the water rectangle to the glass's tapered shape, so
                the liquid narrows toward the base exactly like the glass
                does instead of showing square corners. */}
            <clipPath id="water-tile-glass">
              <path d="M 28 16 L 72 16 L 65 84 L 35 84 Z" />
            </clipPath>
          </defs>

          <rect
            x="20"
            y={waterTop}
            width="60"
            height={86 - waterTop}
            fill={WATER_COLOR}
            fillOpacity="0.85"
            clipPath="url(#water-tile-glass)"
          />

          <path
            d="M 28 16 L 72 16 L 65 84 L 35 84 Z"
            fill="none"
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Rim highlight — reads as the open top of the glass. */}
          <line
            x1="28"
            y1="16"
            x2="72"
            y2="16"
            stroke="#ffffff"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>

        <span className="mt-2 text-2xl font-bold leading-tight text-white">
          {toFaDigits(glasses)}
        </span>
        <span className="text-xs text-white/60">از {toFaDigits(goal)} لیوان</span>
      </div>

      <p
        className="mt-2 text-center text-sm font-semibold"
        style={{ color: glasses >= goal ? "#4ade80" : WATER_COLOR }}
      >
        {glasses >= goal ? "به هدف رسیدی" : "آب"}
      </p>
    </button>
  );
}
