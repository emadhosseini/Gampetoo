import { getCurrentUserHeight } from "@/utils/userEngine";
import { getLatestWeight } from "@/utils/weightEngine";
import { toFaDigits } from "@/utils/numberFormat";

// WHO BMI categories, same thresholds the weight gauge on the progress
// page uses. `from`/`to` are the real BMI bounds; the outermost two are
// clamped to a display floor/ceiling so the marker has somewhere to sit
// for extreme values instead of running off the bar.
const ZONES = [
  {
    label: "کم‌وزن",
    color: "#38bdf8",
    from: 15,
    to: 18.5,
    message: "BMI شما کمتر از حد طبیعی (۱۸.۵) است. بهتره با تغذیه‌ی مناسب کمی وزن بگیری.",
  },
  {
    label: "طبیعی",
    color: "#4ade80",
    from: 18.5,
    to: 25,
    message: "BMI شما در محدوده‌ی طبیعی (۱۸.۵ تا ۲۵) است. همین‌طور ادامه بده.",
  },
  {
    label: "اضافه‌وزن",
    color: "#fbbf24",
    from: 25,
    to: 30,
    message: "BMI شما از حد مجاز (۲۵) بیشتره، یعنی درصد چربی بدنت هم بالاتره. به تحرک بیشتری نیاز داری.",
  },
  {
    label: "چاق",
    color: "#f87171",
    from: 30,
    to: 40,
    message: "BMI شما از ۳۰ بیشتره. بهتره با یه برنامه‌ی تمرینی و غذایی منظم وزن کم کنی.",
  },
];

// Boundary values printed above the bar, at the seams between segments.
const BOUNDARIES = [18.5, 25, 30];

// Every zone gets an equal slice of the bar (like the reference design)
// rather than a slice proportional to its BMI span — so the position is
// piecewise-linear: which quarter, plus how far through that quarter.
function bmiToPercent(bmi: number): number {
  const sliceWidth = 100 / ZONES.length;

  const index = ZONES.findIndex((zone) => bmi < zone.to);
  const zoneIndex = index === -1 ? ZONES.length - 1 : index;
  const zone = ZONES[zoneIndex];

  const withinZone = Math.min(
    1,
    Math.max(0, (bmi - zone.from) / (zone.to - zone.from)),
  );

  return (zoneIndex + withinZone) * sliceWidth;
}

export interface BmiCardProps {
  className?: string;
}

// Shared BMI readout — the profile page and the weight detail page both
// render this exact card. Computes BMI from the latest logged weight and
// the profile height; without both there's nothing honest to plot, so it
// shows what's missing instead of a bar.
export default function BmiCard({ className = "" }: BmiCardProps) {
  const weight = getLatestWeight();
  const height = getCurrentUserHeight();

  const bmi = weight !== null && height !== null ? weight / (height / 100) ** 2 : null;

  if (bmi === null) {
    return (
      <div className={`glass-panel rounded-3xl p-5 ${className}`}>
        <p className="text-lg font-bold text-white">BMI</p>
        <p className="mt-1 text-sm text-white/60">
          {weight === null && height === null
            ? "برای محاسبه، وزن و قدت رو ثبت کن"
            : weight === null
              ? "برای محاسبه، وزنت رو ثبت کن"
              : "برای محاسبه، قدت رو توی حساب کاربری ثبت کن"}
        </p>
      </div>
    );
  }

  const zone = ZONES.find((z) => bmi < z.to) ?? ZONES[ZONES.length - 1];
  const markerPercent = bmiToPercent(bmi);

  return (
    <div className={`glass-panel rounded-3xl p-5 ${className}`}>
      <p className="text-lg font-bold text-white">
        BMI <span className="mr-1">{toFaDigits(bmi.toFixed(1))}</span>
      </p>

      <p className="mt-0.5 font-semibold" style={{ color: zone.color }}>
        {zone.label}
      </p>

      <p className="mt-3 border-t border-white/10 pt-3 text-sm leading-6 text-white/60">
        {zone.message}
      </p>

      {/* Bar direction follows the app's RTL flow: the lowest zone sits at
          the right edge and values grow leftward, so `right` is the
          natural offset axis for both the boundary labels and the marker. */}
      <div className="mt-4">
        <div className="relative h-5 text-xs text-white/60">
          {BOUNDARIES.map((value, i) => (
            <span
              key={value}
              className="absolute translate-x-1/2"
              style={{ right: `${((i + 1) * 100) / ZONES.length}%` }}
            >
              {toFaDigits(value.toFixed(1))}
            </span>
          ))}
        </div>

        <div className="relative">
          <div className="flex gap-1">
            {ZONES.map((z) => (
              <div
                key={z.label}
                className="h-2 flex-1 rounded-full"
                style={{ backgroundColor: z.color }}
              />
            ))}
          </div>

          <span
            aria-hidden="true"
            className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 translate-x-1/2 rounded-full border-2 bg-white"
            style={{ right: `${markerPercent}%`, borderColor: zone.color }}
          />
        </div>

        <div className="mt-2 flex gap-1 text-center text-xs">
          {ZONES.map((z) => (
            <span
              key={z.label}
              className="flex-1"
              style={{ color: z === zone ? z.color : "rgba(255,255,255,0.55)" }}
            >
              {z.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
