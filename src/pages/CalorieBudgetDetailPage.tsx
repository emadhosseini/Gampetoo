import { useState } from "react";

import StatChartPage, { type StatRangeKey } from "@/components/progress/StatChartPage";
import { getCalorieBudgetHistory, getCalorieBudgetSummary } from "@/utils/calorieBudgetEngine";
import { toFaDigits } from "@/utils/numberFormat";

// How far into "کمی بیشتر خوردی" vs "به‌طور محسوسی بیشتر خوردی" territory
// an over-budget window has to land before the harsher recommendation
// kicks in — a fraction of the window's own days counted (roughly "half a
// day's worth of budget per day, on average", not an absolute calorie
// figure, so it scales sensibly between a week and a month).
const SEVERE_OVER_PER_DAY = 400;

// The previous, already-finished period — never "این هفته"/"این ماه" (see
// getCalorieBudgetSummary), since a still-in-progress window would read as
// a shortfall just because most of it hasn't happened yet.
function rangeLabel(range: "week" | "month"): string {
  return range === "week" ? "هفته‌ی گذشته" : "ماه گذشته";
}

// The same plain-language read of a window's total this page's analysis
// text below the chart shows — split out so the "هفته"/"ماه" copy shares
// one source of truth for what counts as a mild vs a real overage.
function describeSummary(range: "week" | "month", total: number, daysCounted: number): string {
  const label = rangeLabel(range);

  if (daysCounted === 0) {
    return `برای ${label} چیزی ثبت نشده بود، پس تحلیلی نداره.`;
  }

  if (total >= 0) {
    return (
      `توی ${label}، در مجموع ${toFaDigits(Math.round(total))} کالری کمتر از سقف مجازت خوردی. ` +
      (total === 0
        ? "دقیقاً روی هدف بودی — همینطور ادامه بده."
        : "روند خوبی بوده، همینطور ادامه بده.")
    );
  }

  const over = Math.abs(total);
  const severe = over > SEVERE_OVER_PER_DAY * daysCounted;

  return (
    `توی ${label}، در مجموع ${toFaDigits(Math.round(over))} کالری بیشتر از سقف مجازت خوردی. ` +
    (severe
      ? "این فاصله قابل توجهه — سعی کن کالری دریافتی رو کم‌تر کنی یا با فعالیت بیشتر جبرانش کنی."
      : "فاصله‌ی زیادی نبوده، ولی حواست بهش باشه که بیشتر نشه.")
  );
}

// "روند کالری مجاز" — how much of the daily calorie budget (target minus
// eaten plus burned) was left over each day, aggregated by week/month.
// Unlike CaloriesDetailPage's raw intake chart, a day here can land on
// either side of zero: a positive bar is a day finished under budget, a
// negative one is a day gone over — StatChartPage's signedBars is what lets
// the bars actually cross the baseline instead of clamping at it.
export default function CalorieBudgetDetailPage() {
  const [range, setRange] = useState<StatRangeKey>("week");

  const weekSummary = getCalorieBudgetSummary("week");
  const monthSummary = getCalorieBudgetSummary("month");

  const activeSummary = range === "month" ? monthSummary : weekSummary;
  const activeRangeKey = range === "month" ? "month" : "week";

  return (
    <StatChartPage
      title="روند کالری مجاز"
      unitLabel="کالری"
      color="#4ade80"
      negativeColor="#f87171"
      signedBars
      minYStep={100}
      valuePrecision={0}
      history={getCalorieBudgetHistory()}
      missingDays="gap"
      chartType="bar"
      defaultRange="week"
      availableRanges={["week", "month"]}
      onRangeChange={setRange}
    >
      <div className="glass-panel glass-static space-y-3 rounded-3xl p-5">
        <p className="text-xs leading-6 text-white/50">
          هر عدد این نمودار، کالری هدف روزانه‌ات منهای کالری دریافتی به‌علاوه
          کالری سوزانده‌شده‌ی همون روزه — دقیقاً همون فرمول «باقیمانده کالری
          مجاز امروز». عدد مثبت یعنی اون روز زیر سقف مجازت بودی، عدد منفی
          یعنی ازش رد شدی. چون هدف کالری فقط یک عدد ذخیره می‌شه و تاریخچه
          نداره، همین هدف فعلی برای روزهای گذشته هم در نظر گرفته شده.
        </p>

        <div className="rounded-2xl bg-white/5 p-3">
          <p className="text-sm leading-7 text-white">
            {describeSummary(activeRangeKey, activeSummary.total, activeSummary.daysCounted)}
          </p>
        </div>
      </div>
    </StatChartPage>
  );
}
