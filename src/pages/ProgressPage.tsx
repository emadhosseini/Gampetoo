import { useNavigate } from "react-router-dom";

import StatCard from "@/components/progress/StatCard";
import WeightGaugeCard from "@/components/progress/WeightGaugeCard";
import CalorieRingCard from "@/components/progress/CalorieRingCard";
import { getTodayGlasses } from "@/utils/waterEngine";
import { getTodayActivityCalories } from "@/utils/activityLogEngine";
import { toFaDigits } from "@/utils/numberFormat";

export default function ProgressPage() {
  const navigate = useNavigate();
  const todaysGlasses = getTodayGlasses();
  const todaysActivityCalories = getTodayActivityCalories();

  return (
    <div className="space-y-4 px-5 pb-5 pt-10">
      <h1 className="text-center text-2xl font-bold text-white">پیشرفت</h1>

      {/* Weight and calories share one row as square tiles; water and
          activity stay full-width rows below them. */}
      <div className="grid grid-cols-2 gap-4">
        <WeightGaugeCard onClick={() => navigate("/progress/weight")} />

        <CalorieRingCard onClick={() => navigate("/progress/calories")} />
      </div>

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
