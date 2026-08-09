import { useState } from "react";

import StatChartPage from "@/components/progress/StatChartPage";
import { useQuickAddMealFlow } from "@/hooks/useQuickAddMealFlow";
import { getCalorieHistory, getCalorieTarget } from "@/utils/dailyLogEngine";

export default function CaloriesDetailPage() {
  // Only the setter is needed — forces a re-render so the plain
  // getCalorieTarget() read below picks up the change; it's not memoized,
  // so any re-render already refreshes it.
  const [, setVersion] = useState(0);

  // The exact same "افزودن غذا" flow the bottom-nav shortcut drawer opens —
  // mode-aware meal picking, add-vs-AI choice, all of it — rather than a
  // second implementation of the same idea.
  const { openFoodFlow, foodFlowModals } = useQuickAddMealFlow(() =>
    setVersion((v) => v + 1),
  );

  const calorieTarget = getCalorieTarget();

  return (
    <>
      {/* The goal-setting card and the کالری هدف/کالری فعلی summary rows
          both used to live here — the goal is now set/viewed from the
          "باقیمانده کالری مجاز امروز" card on the dashboard
          (CalorieOrbCard), and کالری فعلی is just this same chart's own
          today figure, so both were redundant with what this page already
          shows and are gone. Just the chart remains. */}
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
        availableRanges={["week", "month", "sixMonth", "year"]}
        showSummary={false}
        summaryLabels={{
          day: "کالری دریافتی امروز",
          daily: "کالری روزانه",
          monthly: "میانگین کالری ماهیانه",
        }}
      />

      {foodFlowModals}
    </>
  );
}
