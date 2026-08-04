import { useMemo, useState } from "react";

import StatChartPage from "@/components/progress/StatChartPage";
import ActivityLogModal from "@/components/progress/ActivityLogModal";
import { getActivityHistory, getTodayActivityCalories, logActivityCalories } from "@/utils/activityLogEngine";
import { getTodayWorkoutCalories, getWorkoutCalorieHistory } from "@/utils/workoutCalorieEngine";
import { mergeDailyMetricHistories } from "@/utils/dailyMetricLog";
import { toFaDigits } from "@/utils/numberFormat";

export default function ActivityDetailPage() {
  const [history, setHistory] = useState(() => getActivityHistory());
  const [workoutHistory] = useState(() => getWorkoutCalorieHistory());
  const [modalOpen, setModalOpen] = useState(false);

  // The chart's own history is the two sources merged per-date — otherwise
  // its "میانگین" and trend would silently mean something narrower ("just
  // manually-logged activity") than every other number on this page,
  // which is always the combined total (see the progress-page tile and
  // the details card below).
  const combinedHistory = useMemo(
    () => mergeDailyMetricHistories(history, workoutHistory),
    [history, workoutHistory],
  );

  const workoutCalories = getTodayWorkoutCalories();
  const manualCalories = getTodayActivityCalories();

  return (
    <>
      <StatChartPage
        title="فعالیت"
        unitLabel="کالری"
        color="#f97316"
        minYStep={50}
        valuePrecision={0}
        history={combinedHistory}
        onAdd={() => setModalOpen(true)}
        addLabel="ثبت فعالیت"
        missingDays="zero"
        chartType="bar"
      >
        <div className="glass-panel rounded-3xl p-5">
          <p className="text-center text-sm text-white/60">جزئیات امروز</p>

          <p className="mt-1 text-center text-2xl font-bold text-white">
            {toFaDigits(workoutCalories + manualCalories)}{" "}
            <span className="text-sm font-normal text-white/60">کالری</span>
          </p>

          <div className="mt-4 flex justify-between border-t border-white/10 pt-4">
            <div>
              <p className="text-sm text-white/60">برنامه تمرینی</p>
              <p className="mt-1 text-xl font-bold text-white">
                {toFaDigits(workoutCalories)}
              </p>
            </div>

            <div className="text-left">
              <p className="text-sm text-white/60">سایر فعالیت‌ها</p>
              <p className="mt-1 text-xl font-bold text-white">
                {toFaDigits(manualCalories)}
              </p>
            </div>
          </div>
        </div>
      </StatChartPage>

      <ActivityLogModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onLog={(calories) => setHistory(logActivityCalories(calories))}
      />
    </>
  );
}
