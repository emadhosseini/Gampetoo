import { useMemo, useState } from "react";

import StatChartPage from "@/components/progress/StatChartPage";
import ActivityLogModal from "@/components/progress/ActivityLogModal";
import { getActivityHistory, getTodayActivityCalories, logActivityCalories } from "@/utils/activityLogEngine";
import { getTodayWorkoutCalories, getWorkoutCalorieHistory } from "@/utils/workoutCalorieEngine";
import { mergeDailyMetricHistories } from "@/utils/dailyMetricLog";
import { toFaDigits } from "@/utils/numberFormat";

// Workout keeps the orange the chart and the progress tile already use for
// this stat; manual activity gets the sky blue so the split bar reads as two
// sources at a glance without either colour being introduced from nowhere.
const WORKOUT_COLOR = "#f97316";
const MANUAL_COLOR = "#38bdf8";

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
  const totalCalories = workoutCalories + manualCalories;

  const segments = [
    { key: "workout", value: workoutCalories, color: WORKOUT_COLOR },
    { key: "manual", value: manualCalories, color: MANUAL_COLOR },
  ].filter((segment) => segment.value > 0);

  return (
    <>
      <StatChartPage
        title="فعالیت روزانه"
        unitLabel="کالری"
        color={WORKOUT_COLOR}
        minYStep={50}
        valuePrecision={0}
        history={combinedHistory}
        onAdd={() => setModalOpen(true)}
        addLabel="ثبت فعالیت"
        missingDays="zero"
        chartType="bar"
        defaultRange="week"
        summaryLabels={{
          day: "فعالیت امروز",
          daily: "فعالیت روزانه",
          monthly: "میانگین فعالیت ماهیانه",
        }}
      >
        <div className="glass-panel rounded-3xl p-5">
          <p className="text-center text-sm text-white/60">جزئیات امروز</p>

          <p className="mt-1 text-center text-2xl font-bold text-white">
            {toFaDigits(totalCalories)}{" "}
            <span className="text-sm font-normal text-white/60">کالری</span>
          </p>

          <div className="mt-4 flex justify-between border-t border-white/10 pt-4">
            <div>
              <p className="flex items-center gap-2 text-sm text-white/60">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: WORKOUT_COLOR }}
                />
                برنامه تمرینی
              </p>
              <p className="mt-1 text-xl font-bold text-white">
                {toFaDigits(workoutCalories)}
              </p>
            </div>

            <div className="text-left">
              <p className="flex items-center gap-2 text-sm text-white/60">
                سایر فعالیت‌ها
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: MANUAL_COLOR }}
                />
              </p>
              <p className="mt-1 text-xl font-bold text-white">
                {toFaDigits(manualCalories)}
              </p>
            </div>
          </div>

          {/* The split between the two sources, as a shape rather than a
              number — the two figures above already say how much each was,
              so a percentage here would only restate them. RTL puts the
              first segment at the right edge, lining it up with the
              برنامه تمرینی column it belongs to. An empty day has nothing
              to divide, so it keeps a flat neutral track instead of
              collapsing to a zero-width sliver. */}
          <div className="mt-4 flex h-2 gap-1">
            {segments.length > 0 ? (
              // Only non-zero sources get a segment: a zero-width one would
              // still cost the flex gap beside it, reading as a sliver of
              // dead space where there is simply no second source.
              segments.map((segment) => (
                <div
                  key={segment.key}
                  className="rounded-full transition-[flex-grow] duration-300"
                  style={{
                    flexGrow: segment.value,
                    backgroundColor: segment.color,
                  }}
                />
              ))
            ) : (
              <div className="flex-1 rounded-full bg-white/10" />
            )}
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
