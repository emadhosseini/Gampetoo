import { useNavigate } from "react-router-dom";

import StatCard from "@/components/progress/StatCard";
import WeightGaugeCard from "@/components/progress/WeightGaugeCard";
import { getCalorieTarget, getTodaysTotalCalories } from "@/utils/dailyLogEngine";
import { getTodayGlasses } from "@/utils/waterEngine";
import { getTodayActivityCalories } from "@/utils/activityLogEngine";
import { toFaDigits } from "@/utils/numberFormat";

export default function ProgressPage() {
  const navigate = useNavigate();
  const todaysCalories = getTodaysTotalCalories();
  const todaysGlasses = getTodayGlasses();
  const todaysActivityCalories = getTodayActivityCalories();
  const calorieTarget = getCalorieTarget();

  return (
    <div className="space-y-4 px-5 pb-5 pt-10">
      <h1 className="text-center text-2xl font-bold text-white">پیشرفت</h1>

      <WeightGaugeCard onClick={() => navigate("/progress/weight")} />

      <StatCard
        title="کالری روزانه"
        icon="🍽️"
        value={`${toFaDigits(todaysCalories)} کالری`}
        goalLabel={calorieTarget !== null ? `کالری هدف: ${toFaDigits(calorieTarget)} کالری` : "بدون هدف"}
        onClick={() => navigate("/progress/calories")}
      />

      <StatCard
        title="آب"
        icon="💧"
        value={`${toFaDigits(todaysGlasses)} لیوان`}
        onClick={() => navigate("/progress/water")}
      />

      <StatCard
        title="فعالیت"
        icon="🔥"
        value={`${toFaDigits(todaysActivityCalories)} کالری`}
        onClick={() => navigate("/progress/activity")}
      />
    </div>
  );
}
