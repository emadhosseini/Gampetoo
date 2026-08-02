import WeightSummaryCard from "@/components/progress/WeightSummaryCard";
import StatCard from "@/components/progress/StatCard";
import { getTodaysTotalCalories } from "@/utils/dailyLogEngine";
import { toFaDigits } from "@/utils/numberFormat";

export default function ProgressPage() {
  const todaysCalories = getTodaysTotalCalories();

  return (
    <div className="space-y-4 px-5 pb-5 pt-10">
      <h1 className="text-center text-2xl font-bold text-white">پیشرفت</h1>

      <WeightSummaryCard />

      <StatCard title="کالری روزانه" icon="🍽️" value={`${toFaDigits(todaysCalories)} کالری`} />

      <StatCard title="آب" icon="💧" value="۰ لیوان" />

      <StatCard title="فعالیت" icon="🔥" value="۰ کالری" />
    </div>
  );
}
