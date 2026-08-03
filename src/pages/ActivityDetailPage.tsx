import { useState } from "react";

import StatChartPage from "@/components/progress/StatChartPage";
import ActivityLogModal from "@/components/progress/ActivityLogModal";
import { getActivityHistory, logActivityCalories } from "@/utils/activityLogEngine";

export default function ActivityDetailPage() {
  const [history, setHistory] = useState(() => getActivityHistory());
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <StatChartPage
        title="فعالیت"
        unitLabel="کالری"
        color="#f97316"
        minYStep={50}
        valuePrecision={0}
        history={history}
        onAdd={() => setModalOpen(true)}
        addLabel="ثبت فعالیت"
      />

      <ActivityLogModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onLog={(calories) => setHistory(logActivityCalories(calories))}
      />
    </>
  );
}
