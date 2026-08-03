import { useNavigate } from "react-router-dom";

import WeightSummaryCard from "@/components/progress/WeightSummaryCard";
import StatCard from "@/components/progress/StatCard";
import { getTodaysTotalCalories } from "@/utils/dailyLogEngine";
import { getTodayGlasses } from "@/utils/waterEngine";
import { getTodayActivityCalories } from "@/utils/activityLogEngine";
import { toFaDigits } from "@/utils/numberFormat";

export default function ProgressPage() {
  const navigate = useNavigate();
  const todaysCalories = getTodaysTotalCalories();
  const todaysGlasses = getTodayGlasses();
  const todaysActivityCalories = getTodayActivityCalories();

  return (
    <div className="space-y-4 px-5 pb-5 pt-10">
      <h1 className="text-center text-2xl font-bold text-white">پیشرفت</h1>

      <WeightSummaryCard />

      <StatCard
        title="کالری روزانه"
        icon="🍽️"
        value={`${toFaDigits(todaysCalories)} کالری`}
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
