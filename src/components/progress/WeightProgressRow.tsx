import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Weight as WeightIcon } from "lucide-react";

import TargetWeightModal from "@/components/progress/TargetWeightModal";
import { getCurrentUserHeight } from "@/utils/userEngine";
import { getTargetWeight, getWeightLog } from "@/utils/weightEngine";
import { toFaDigits } from "@/utils/numberFormat";
import {
  BMI_ZONES,
  GAUGE_STROKE,
  SEGMENT_GAP_DEG,
  arcPath,
  bmiToAngle,
  calculateBmi,
  findBmiZone,
} from "@/utils/bmiGauge";

// Same dial WeightGaugeCard draws (see @/utils/bmiGauge), but every zone
// stays in its own color here instead of dimming to gray until it's the
// active one — a small inline dial reads better fully colorful, like an
// actual scale's dial face, and the needle is what points out today's
// weight on it rather than a highlighted band.
//
// The weight/category text sits BELOW the svg in normal flow, not
// overlaid on it — an earlier version absolutely positioned it over the
// dial's bottom edge to save height, but that's exactly where the
// needle's pivot and the arc's own labels sit, so the two kept landing on
// top of each other. Normal flow costs a bit more vertical space but
// never collides with anything.
function WeightBmiGauge({ weight, height }: { weight: number; height: number | null }) {
  const bmi = height !== null ? calculateBmi(weight, height) : null;
  const activeZone = bmi !== null ? findBmiZone(bmi) : null;

  return (
    <div className="mx-auto w-full max-w-40">
      <svg viewBox="0 0 200 112" className="w-full">
        {BMI_ZONES.map((zone) => {
          const from = bmiToAngle(zone.from) - SEGMENT_GAP_DEG;
          const to = bmiToAngle(zone.to) + SEGMENT_GAP_DEG;

          return (
            <path
              key={zone.label}
              d={arcPath(from, to)}
              fill="none"
              stroke={zone.color}
              strokeWidth={GAUGE_STROKE}
              strokeLinecap="round"
              opacity={activeZone === zone ? 1 : 0.55}
            />
          );
        })}

        {/* The needle — a classic scale's pivoted pointer, not just a dot
            on the arc: a long thin arm from the center pivot out toward
            the value, plus a small round pivot cap over its base. */}
        {bmi !== null && (
          <g transform={`rotate(${(90 - bmiToAngle(bmi)).toFixed(2)} 100 100)`}>
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="28"
              stroke="#ffffff"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
        )}

        <circle cx="100" cy="100" r="7" fill="#ffffff" />
        <circle cx="100" cy="100" r="3.5" fill="#18181b" />
      </svg>

      <p className="mt-1 text-center text-lg font-bold leading-tight text-white">
        {toFaDigits(weight)} <span className="text-xs font-normal text-white/60">کیلوگرم</span>
      </p>
    </div>
  );
}

// Experimental — same shape as WaterProgressRow, but tapping anywhere on
// this card (other than the target pencil) goes to /progress/weight and
// its full chart, the same way CalorieOrbCard's other two cards go to
// their own detail pages — logging a new weight belongs on that page, not
// as a quick-add popup from here.
export default function WeightProgressRow() {
  const navigate = useNavigate();

  const [targetOpen, setTargetOpen] = useState(false);
  // getWeightLog/getTargetWeight/getCurrentUserHeight read straight from
  // localStorage — bumping this is what picks up a fresh value after
  // retargeting.
  const [, forceRerender] = useState(0);

  const entries = getWeightLog();
  const current = entries.length > 0 ? entries[entries.length - 1].weight : null;
  const height = getCurrentUserHeight();
  const target = getTargetWeight();

  // Rounded to one decimal — weight is stored to two (round2 in
  // weightEngine), and floating-point subtraction on two such values can
  // land on something like 14.900000000006 instead of a clean 14.9.
  const remainingKg =
    current !== null && target !== null
      ? Math.round(Math.abs(current - target) * 10) / 10
      : null;

  const bmi = current !== null && height !== null ? calculateBmi(current, height) : null;
  const activeZone = bmi !== null ? findBmiZone(bmi) : null;

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => navigate("/progress/weight")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") navigate("/progress/weight");
        }}
        className="flex cursor-pointer flex-col gap-2"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WeightIcon size={18} className="text-white/70" />
            <span className="text-sm font-semibold text-white">وزن</span>
          </div>

          {activeZone !== null && (
            <span className="text-xs font-semibold" style={{ color: activeZone.color }}>
              {activeZone.label}
            </span>
          )}
        </div>

        {current === null ? (
          <p className="py-2 text-center text-xs leading-5 text-white/50">
            برای این بخش، اول وزنت رو ثبت کن
          </p>
        ) : (
          <>
            <WeightBmiGauge weight={current} height={height} />

            <div className="flex items-center justify-between text-xs text-white/50">
              <span>وزن فعلی: {toFaDigits(current)} کیلوگرم</span>

              <span className="flex items-center gap-2">
                {target !== null
                  ? `هدف: ${toFaDigits(target)} کیلوگرم${
                      remainingKg !== null ? ` (${toFaDigits(remainingKg)} مانده)` : ""
                    }`
                  : "بدون هدف"}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTargetOpen(true);
                  }}
                  aria-label="تغییر وزن هدف"
                  className="glass-chip shrink-0 rounded-full p-1 text-white/70"
                >
                  <Pencil size={12} />
                </button>
              </span>
            </div>
          </>
        )}
      </div>

      <TargetWeightModal
        open={targetOpen}
        onClose={() => setTargetOpen(false)}
        onSaved={() => forceRerender((n) => n + 1)}
      />
    </>
  );
}
