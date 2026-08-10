import TodayDashboardCard from "@/components/progress/TodayDashboardCard";
import OverallStrengthRadar from "@/components/progress/OverallStrengthRadar";
import { getStrengthDashboardData } from "@/utils/strengthStatsEngine";

// The old square stat tiles (weight, calorie, activity, water) are all
// gone now — each moved into its own tappable card inside
// TodayDashboardCard instead.
export default function ProgressPage() {
  const strength = getStrengthDashboardData();

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
    </div>
  );
}
