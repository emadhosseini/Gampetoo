import { useNavigate } from "react-router-dom";

import StatChartPage from "@/components/progress/StatChartPage";
import { getCalorieHistory } from "@/utils/dailyLogEngine";

export default function CaloriesDetailPage() {
  const navigate = useNavigate();

  return (
    <StatChartPage
      title="کالری روزانه"
      unitLabel="کالری"
      color="#9dc730"
      minYStep={50}
      valuePrecision={0}
      history={getCalorieHistory()}
      onAdd={() => navigate("/daily-log")}
      addLabel="ثبت غذا"
    />
  );
}
