import { useState } from "react";

import StatChartPage from "@/components/progress/StatChartPage";
import { getWaterHistory, logGlass } from "@/utils/waterEngine";

export default function WaterDetailPage() {
  const [history, setHistory] = useState(() => getWaterHistory());

  return (
    <StatChartPage
      title="آب"
      unitLabel="لیوان"
      color="#38bdf8"
      minYStep={1}
      valuePrecision={0}
      history={history}
      // A single tap logs one glass directly — unlike weight/activity,
      // there's no value worth typing in for "how much water", so a modal
      // would just be an extra step for no benefit.
      onAdd={() => setHistory(logGlass())}
      addLabel="ثبت یک لیوان آب"
      bucketingReady={false}
    />
  );
}
