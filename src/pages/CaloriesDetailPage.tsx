import { useState } from "react";
import { useNavigate } from "react-router-dom";

import CalorieGoalCard from "@/components/progress/CalorieGoalCard";
import StatChartPage from "@/components/progress/StatChartPage";
import TargetCaloriesModal from "@/components/progress/TargetCaloriesModal";
import { getCalorieHistory, getCalorieTarget, getTodaysTotalCalories } from "@/utils/dailyLogEngine";
import { toFaDigits } from "@/utils/numberFormat";

export default function CaloriesDetailPage() {
  const navigate = useNavigate();
  const [targetModalOpen, setTargetModalOpen] = useState(false);
  // Only the setter is needed — forces a re-render so the plain
  // getCalorieTarget() read below picks up the change; it's not memoized,
  // so any re-render already refreshes it.
  const [, setVersion] = useState(0);

  const todaysCalories = getTodaysTotalCalories();
  const calorieTarget = getCalorieTarget();

  return (
    <>
      <StatChartPage
        title="کالری روزانه"
        unitLabel="کالری"
        color="#9dc730"
        minYStep={50}
        valuePrecision={0}
        history={getCalorieHistory()}
        onAdd={() => navigate("/daily-log")}
        addLabel="ثبت غذا"
        targetValue={calorieTarget ?? undefined}
        targetLabel="کالری هدف"
        missingDays="zero"
        chartType="bar"
        defaultRange="week"
        summaryLabels={{
          day: "کالری دریافتی امروز",
          daily: "کالری روزانه",
          monthly: "میانگین کالری ماهیانه",
        }}
      >
        {/* First child, so it sits directly under the chart panel — the
            chart's own panel is flush to the top of the screen, so this is
            as high as anything can go on this page. Saving here writes the
            same emad-daily-calorie-target the chart's dashed line already
            reads, and the version bump re-renders the page around it, so
            that line follows the calculated number with no extra wiring. */}
        <CalorieGoalCard onSaved={() => setVersion((v) => v + 1)} />

        {/* Label first, value second — RTL puts the first child at the right
            edge, so the numbers line up down the left. The colour dot leads
            its label as a chart legend rather than trailing it, which after
            the swap would have stranded it mid-row. */}
        <div className="glass-panel glass-static space-y-3 rounded-3xl p-5">
          <button
            onClick={() => setTargetModalOpen(true)}
            className="flex w-full items-center justify-between"
          >
            <span className="flex items-center gap-2 text-white">
              <span className="h-3.5 w-3.5 rounded-full border-2 border-red-400" />
              کالری هدف
            </span>

            <span className="text-white">
              {calorieTarget !== null ? `${toFaDigits(calorieTarget)} کالری` : "بدون هدف"}
            </span>
          </button>

          <div className="flex w-full items-center justify-between border-t border-white/10 pt-3">
            <span className="flex items-center gap-2 text-white">
              <span className="h-3.5 w-3.5 rounded-full border-2 border-blue-400 bg-blue-400" />
              کالری فعلی
            </span>

            <span className="text-white">{toFaDigits(todaysCalories)} کالری</span>
          </div>
        </div>
      </StatChartPage>

      <TargetCaloriesModal
        open={targetModalOpen}
        onClose={() => setTargetModalOpen(false)}
        onSaved={() => setVersion((v) => v + 1)}
      />
    </>
  );
}
