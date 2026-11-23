import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import BodyMeasurementsOverviewChart from "@/components/progress/BodyMeasurementsOverviewChart";
import BodySilhouette from "@/components/progress/BodySilhouette";
import { navigateBackSafely } from "@/utils/navigationBack";
import {
  MEASUREMENT_LABELS,
  MEASUREMENT_TYPES,
  getLatestValue,
  getMeasurementLog,
} from "@/utils/bodyMeasurementsEngine";
import {
  getBodyShapeBaselineValues,
  getBodyShapeValues,
  hasAnyBodyShapeData,
  hasBodyShapeChange,
} from "@/utils/bodyShapeEngine";
import { getWeightLog } from "@/utils/weightEngine";
import { toFaDigits } from "@/utils/numberFormat";

// The list of eight measurement types as a 3-per-row grid of compact tiles
// (there's no room for a chevron/description at that width, so the whole
// tile is the tap target) — tapping one goes to that metric's own trend
// chart + add flow (BodyMeasurementDetailPage), the same drill-down pattern
// the weight/calorie/activity detail pages already use.
export default function BodyMeasurementsPage() {
  const navigate = useNavigate();
  const entries = getMeasurementLog();
  const weightEntries = getWeightLog().map((entry) => ({
    date: entry.date,
    value: entry.weight,
  }));
  const shapeValues = getBodyShapeValues();
  const hasShapeData = hasAnyBodyShapeData();
  const hasChange = hasBodyShapeChange();
  const baselineValues = hasChange ? getBodyShapeBaselineValues() : undefined;

  return (
    <div className="space-y-4 px-5 pb-5 pt-10">
      <div className="relative flex items-center justify-center">
        <button
          onClick={() => navigateBackSafely(navigate, "/progress/body-measurements")}
          aria-label="بازگشت"
          className="glass-chip absolute right-0 flex h-9 w-9 items-center justify-center rounded-full"
        >
          <ChevronRight size={18} />
        </button>

        <h1 className="text-center text-lg font-bold text-white">اندازه‌ها</h1>
      </div>

      <div className="glass-panel glass-static space-y-1 rounded-2xl p-4">
        <h2 className="text-center text-sm font-semibold text-white/70">شکل بدن</h2>
        <p className="text-center text-[11px] text-white/40">
          {hasChange ? "خط‌چین: شروع تراکینگ — پررنگ: الان" : "تقریبی، بر اساس آخرین اندازه‌های ثبت‌شده"}
        </p>

        <div className="relative mx-auto mt-2 h-48 w-full max-w-72">
          <div
            className="pointer-events-none absolute inset-0 -z-10 rounded-full blur-2xl"
            style={{
              background:
                "radial-gradient(closest-side, rgb(250 234 92 / 16%), transparent 70%)",
            }}
          />
          <BodySilhouette
            values={shapeValues}
            baselineValues={baselineValues}
            className="h-full w-full"
          />
        </div>

        {!hasShapeData && (
          <p className="mt-1 text-center text-[11px] leading-5 text-white/45">
            برای دیدن شکل واقعی بدنت، اندازه‌هات رو از پایین ثبت کن
          </p>
        )}
      </div>

      <BodyMeasurementsOverviewChart entries={entries} weightEntries={weightEntries} />

      <div className="grid grid-cols-3 gap-3">
        {MEASUREMENT_TYPES.map((type) => {
          const value = getLatestValue(type);

          return (
            <button
              key={type}
              onClick={() => navigate(`/progress/body-measurements/${type}`)}
              className="glass-panel flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-center"
            >
              <p className="text-xs font-semibold leading-snug text-white">
                {MEASUREMENT_LABELS[type]}
              </p>
              <p className="text-[11px] text-white/50">
                {value !== null ? `${toFaDigits(value)} سانتی‌متر` : "ثبت نشده"}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
