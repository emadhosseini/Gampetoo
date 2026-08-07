import { useState } from "react";

import CalorieGoalCard from "@/components/progress/CalorieGoalCard";
import StatChartPage from "@/components/progress/StatChartPage";
import { useQuickAddMealFlow } from "@/hooks/useQuickAddMealFlow";
import { getCalorieHistory, getCalorieTarget, getTodaysTotalCalories } from "@/utils/dailyLogEngine";
import { toFaDigits } from "@/utils/numberFormat";

export default function CaloriesDetailPage() {
  // Only the setter is needed — forces a re-render so the plain
  // getCalorieTarget() read below picks up the change; it's not memoized,
  // so any re-render already refreshes it.
  const [, setVersion] = useState(0);

  // The exact same "افزودن غذا" flow the bottom-nav shortcut drawer opens —
  // mode-aware meal picking, add-vs-AI choice, all of it — rather than a
  // second implementation of the same idea. Bumping the version here (which
  // the shortcut drawer has no reason to do, since it has no numbers of its
  // own on screen) is what makes کالری فعلی and the chart follow a meal
  // added from here without a reload.
  const { openFoodFlow, foodFlowModals } = useQuickAddMealFlow(() =>
    setVersion((v) => v + 1),
  );

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
        onAdd={openFoodFlow}
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
          {/* Display-only: CalorieGoalCard right above is the one place on
              this page that edits the target now, via its choice of manual
              entry or calculation. A second, direct tap-to-edit entry point
              here just meant the same number could be changed two
              different ways from the same screen. */}
          <div className="flex w-full items-center justify-between">
            <span className="flex items-center gap-2 text-white">
              <span className="h-3.5 w-3.5 rounded-full border-2 border-red-400" />
              کالری هدف
            </span>

            <span className="text-white">
              {calorieTarget !== null ? `${toFaDigits(calorieTarget)} کالری` : "بدون هدف"}
            </span>
          </div>

          <div className="flex w-full items-center justify-between border-t border-white/10 pt-3">
            <span className="flex items-center gap-2 text-white">
              <span className="h-3.5 w-3.5 rounded-full border-2 border-blue-400 bg-blue-400" />
              کالری فعلی
            </span>

            <span className="text-white">{toFaDigits(todaysCalories)} کالری</span>
          </div>
        </div>
      </StatChartPage>

      {foodFlowModals}
    </>
  );
}
