import { getCurrentUserHeight } from "@/utils/userEngine";
import { getWeightLog } from "@/utils/weightEngine";
import { toFaDigits } from "@/utils/numberFormat";

// The gauge's BMI window and zone boundaries (WHO categories, same
// thresholds as ProfilePage's BMI card). 15–40 spans comfortably past
// both outer zones so the pointer never pins to an end for realistic
// values.
const BMI_MIN = 15;
const BMI_MAX = 40;

const BMI_ZONES = [
  { from: BMI_MIN, to: 18.5, label: "کم‌وزن", color: "#38bdf8" },
  { from: 18.5, to: 25, label: "طبیعی", color: "#4ade80" },
  { from: 25, to: 30, label: "اضافه‌وزن", color: "#fbbf24" },
  { from: 30, to: BMI_MAX, label: "چاق", color: "#f87171" },
];

// Semicircle geometry: center (100,100), arc over the top from 180° (left)
// to 0° (right) — mapped so BMI_MIN sits at the left end.
const CX = 100;
const CY = 100;
const RADIUS = 84;
const STROKE = 13;
// Degrees shaved off each side of every zone arc, so the segments read as
// separate pills (like the reference design) instead of one joined band.
const SEGMENT_GAP_DEG = 3;

function bmiToAngle(bmi: number): number {
  const clamped = Math.min(BMI_MAX, Math.max(BMI_MIN, bmi));

  return 180 - ((clamped - BMI_MIN) / (BMI_MAX - BMI_MIN)) * 180;
}

function polar(angleDeg: number, radius: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;

  return { x: CX + radius * Math.cos(rad), y: CY - radius * Math.sin(rad) };
}

function arcPath(fromDeg: number, toDeg: number): string {
  const start = polar(fromDeg, RADIUS);
  const end = polar(toDeg, RADIUS);

  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${RADIUS} ${RADIUS} 0 0 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

export interface WeightGaugeCardProps {
  onClick: () => void;
}

// The progress page's weight card: a compact square tile (it shares a
// row with the calories tile) holding a semicircular BMI dial, the
// current weight in its hollow, and the BMI category — computed from the
// profile's height — named and colored underneath. No title/date line:
// the dial and unit already say what this is, and the row needs the
// vertical space. Falls back gracefully when weight or height isn't
// logged yet — a neutral dial with no pointer, never a fabricated status.
export default function WeightGaugeCard({ onClick }: WeightGaugeCardProps) {
  const entries = getWeightLog();
  const latest = entries.length > 0 ? entries[entries.length - 1] : null;
  const height = getCurrentUserHeight();

  const bmi =
    latest !== null && height !== null
      ? latest.weight / (height / 100) ** 2
      : null;

  const activeZone =
    bmi !== null
      ? (BMI_ZONES.find((zone) => bmi < zone.to) ?? BMI_ZONES[BMI_ZONES.length - 1])
      : null;

  const pointer = bmi !== null ? polar(bmiToAngle(bmi), RADIUS) : null;

  return (
    <button
      onClick={onClick}
      className="glass-panel flex w-full flex-col justify-center rounded-2xl p-4"
    >
      <div className="relative mx-auto w-full">
        <svg viewBox="0 0 200 112" className="w-full">
          {BMI_ZONES.map((zone) => {
            const from = bmiToAngle(zone.from) - SEGMENT_GAP_DEG;
            const to = bmiToAngle(zone.to) + SEGMENT_GAP_DEG;
            const isActive = activeZone === zone;

            return (
              <path
                key={zone.label}
                d={arcPath(from, to)}
                fill="none"
                stroke={isActive ? zone.color : "rgba(255,255,255,0.18)"}
                strokeWidth={STROKE}
                strokeLinecap="round"
              />
            );
          })}

          {pointer && bmi !== null && (
            <g
              transform={`translate(${pointer.x.toFixed(2)} ${pointer.y.toFixed(2)}) rotate(${(90 - bmiToAngle(bmi)).toFixed(2)})`}
            >
              <path d="M 0 -5.5 L 5 4.5 L -5 4.5 Z" fill="#ffffff" />
            </g>
          )}
        </svg>

        <div className="absolute inset-x-0 bottom-0 text-center">
          <p className="text-2xl font-bold leading-tight text-white">
            {latest ? toFaDigits(latest.weight) : "—"}
          </p>
          <p className="text-xs text-white/60">کیلوگرم</p>
        </div>
      </div>

      {activeZone !== null ? (
        <p
          className="mt-2 text-center text-sm font-semibold"
          style={{ color: activeZone.color }}
        >
          {activeZone.label}
        </p>
      ) : (
        <p className="mt-2 text-center text-xs leading-5 text-white/50">
          {latest ? "قدت رو ثبت کن" : "وزنی ثبت نشده"}
        </p>
      )}
    </button>
  );
}
