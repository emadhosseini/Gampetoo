import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
      >
        <div className="glass-panel glass-static space-y-3 rounded-3xl p-5">
          <button
            onClick={() => setTargetModalOpen(true)}
            className="flex w-full items-center justify-between"
          >
            <span className="text-white">
              {calorieTarget !== null ? `${toFaDigits(calorieTarget)} کالری` : "بدون هدف"}
            </span>

            <span className="flex items-center gap-2 text-white">
              کالری هدف
              <span className="h-3.5 w-3.5 rounded-full border-2 border-red-400" />
            </span>
          </button>

          <div className="flex w-full items-center justify-between border-t border-white/10 pt-3">
            <span className="text-white">{toFaDigits(todaysCalories)} کالری</span>

            <span className="flex items-center gap-2 text-white">
              کالری فعلی
              <span className="h-3.5 w-3.5 rounded-full border-2 border-blue-400 bg-blue-400" />
            </span>
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
