import { useState } from "react";
import { useNavigate } from "react-router-dom";

import BmiCard from "@/components/BmiCard";
import StatChartPage from "@/components/progress/StatChartPage";
import TargetWeightModal from "@/components/progress/TargetWeightModal";
import WeightHistoryModal from "@/components/progress/WeightHistoryModal";
import { getLatestWeight, getTargetWeight, getWeightLog } from "@/utils/weightEngine";
import { toFaDigits } from "@/utils/numberFormat";

export default function WeightDetailPage() {
  const navigate = useNavigate();
  const [targetModalOpen, setTargetModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  // Only the setter is needed — forces a re-render so the plain
  // getTargetWeight()/getLatestWeight() reads below pick up the change;
  // they're not memoized, so any re-render already refreshes them.
  const [, setVersion] = useState(0);

  const entries = getWeightLog();
  const currentWeight = getLatestWeight();
  const targetWeight = getTargetWeight();

  return (
    <>
      <StatChartPage
        title="وزن"
        unitLabel="کیلوگرم"
        color="#faea5c"
        minYStep={1}
        valuePrecision={2}
        history={entries.map((entry) => ({ date: entry.date, value: entry.weight }))}
        onAdd={() => navigate("/settings/weight")}
        addLabel="افزودن وزن"
        targetValue={targetWeight ?? undefined}
        targetLabel="وزن هدف"
      >
        <div className="glass-panel glass-static space-y-3 rounded-3xl p-5">
          <button
            onClick={() => setTargetModalOpen(true)}
            className="flex w-full items-center justify-between"
          >
            <span className="text-white">
              {targetWeight !== null
                ? `${toFaDigits(targetWeight)} کیلوگرم`
                : "بدون هدف"}
            </span>

            <span className="flex items-center gap-2 text-white">
              وزن هدف
              <span className="h-3.5 w-3.5 rounded-full border-2 border-red-400" />
            </span>
          </button>

          <div className="flex w-full items-center justify-between border-t border-white/10 pt-3">
            <span className="text-white">
              {currentWeight !== null
                ? `${toFaDigits(currentWeight)} کیلوگرم`
                : "ثبت نشده"}
            </span>

            <span className="flex items-center gap-2 text-white">
              وزن فعلی
              <span className="h-3.5 w-3.5 rounded-full border-2 border-blue-400 bg-blue-400" />
            </span>
          </div>
        </div>

        <BmiCard />

        <button
          onClick={() => setHistoryModalOpen(true)}
          className="ghost-action w-full rounded-2xl py-3 text-sm font-medium text-white"
        >
          مشاهده و ویرایش تاریخچه وزن
        </button>
      </StatChartPage>

      <TargetWeightModal
        open={targetModalOpen}
        onClose={() => setTargetModalOpen(false)}
        onSaved={() => setVersion((v) => v + 1)}
      />

      <WeightHistoryModal
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        onChange={() => setVersion((v) => v + 1)}
      />
    </>
  );
}
