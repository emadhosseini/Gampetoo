import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import TodayDashboardCard from "@/components/progress/TodayDashboardCard";
import OverallStrengthRadar from "@/components/progress/OverallStrengthRadar";
import BodySilhouette from "@/components/progress/BodySilhouette";
import { getStrengthDashboardData } from "@/utils/strengthStatsEngine";
import { getBodyShapeValues } from "@/utils/bodyShapeEngine";

// The old square stat tiles (weight, calorie, activity, water) are all
// gone now — each moved into its own tappable card inside
// TodayDashboardCard instead.
export default function ProgressPage() {
  const navigate = useNavigate();
  const strength = getStrengthDashboardData();
  const shapeValues = getBodyShapeValues();

  return (
    <div className="space-y-4 px-5 pb-5 pt-10">
      <TodayDashboardCard />

      <div className="glass-panel glass-static rounded-2xl p-4">
        <h2 className="text-center text-sm font-semibold text-white/70">
          شاخص قدرت کلی بدن
        </h2>

        <div className="mt-2">
          <OverallStrengthRadar
            chartData={strength.chartData}
            totalScore={strength.totalScore}
            maxScore={strength.maxScore}
            level={strength.level}
            insight={strength.insight}
          />
        </div>
      </div>

      {/* A live body-shape preview — scaled from getBodyShapeScales against a
          fixed reference build — big and up top; the trend charts/history
          live only on the full page (BodyMeasurementsPage), one tap away.
          A real button (navigates on tap), so it keeps the default
          glass-panel press animation rather than .glass-static. */}
      <button
        onClick={() => navigate("/progress/body-measurements")}
        className="glass-panel flex w-full flex-col items-center gap-1 rounded-2xl p-4"
      >
        <h2 className="text-center text-sm font-semibold text-white/70">شکل بدن</h2>

        <div className="relative h-44 w-full max-w-64">
          <div
            className="pointer-events-none absolute inset-0 -z-10 rounded-full blur-2xl"
            style={{
              background:
                "radial-gradient(closest-side, rgb(250 234 92 / 16%), transparent 70%)",
            }}
          />
          <BodySilhouette values={shapeValues} className="h-full w-full" />
        </div>

        <span className="flex w-full items-center justify-between border-t border-white/10 pt-3">
          <span className="text-right">
            <p className="text-sm font-semibold text-white">اندازه‌های بدن</p>
            <p className="mt-0.5 text-xs text-white/50">ثبت و روند دور بازو، سینه، کمر و...</p>
          </span>

          <ChevronLeft size={18} className="shrink-0 text-white/50" />
        </span>
      </button>
    </div>
  );
}
