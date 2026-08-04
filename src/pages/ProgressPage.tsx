import { useNavigate } from "react-router-dom";

import WeightGaugeCard from "@/components/progress/WeightGaugeCard";
import CalorieRingCard from "@/components/progress/CalorieRingCard";
import WaterTileCard from "@/components/progress/WaterTileCard";
import ActivityTileCard from "@/components/progress/ActivityTileCard";

export default function ProgressPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4 px-5 pb-5 pt-10">
      {/* All four stats as equal square tiles, two per row. */}
      <div className="grid grid-cols-2 gap-4">
        <WeightGaugeCard onClick={() => navigate("/progress/weight")} />

        <CalorieRingCard onClick={() => navigate("/progress/calories")} />

        <WaterTileCard onClick={() => navigate("/progress/water")} />

        <ActivityTileCard onClick={() => navigate("/progress/activity")} />
      </div>
    </div>
  );
}
