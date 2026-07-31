import { useMemo, useState } from "react";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type TooltipItem,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useNavigate } from "react-router-dom";

import TargetWeightModal from "./TargetWeightModal";
import {
  getLatestWeight,
  getTargetWeight,
  getWeightLog,
} from "@/utils/weightEngine";
import { formatGregorianShort } from "@/utils/dateFormat";
import { toFaDigits } from "@/utils/numberFormat";

const CHART_FONT_FAMILY = "Vazirmatn";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

function isoToLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);

  return new Date(y, m - 1, d);
}

export default function WeightSummaryCard() {
  const navigate = useNavigate();
  const [targetModalOpen, setTargetModalOpen] = useState(false);
  const [version, setVersion] = useState(0);

  const entries = getWeightLog();
  const currentWeight = getLatestWeight();
  const targetWeight = getTargetWeight();

  const chartData = useMemo(
    () => ({
      labels: entries.map((entry) => formatGregorianShort(isoToLocalDate(entry.date))),
      datasets: [
        {
          data: entries.map((entry) => entry.weight),
          borderColor: "#faea5c",
          backgroundColor: "rgba(250, 234, 92, 0.15)",
          pointBackgroundColor: "#faea5c",
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.3,
          fill: true,
        },
      ],
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries, version],
  );

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: { color: "#ffffff", font: { family: CHART_FONT_FAMILY, size: 10 } },
        grid: { display: false },
      },
      y: {
        ticks: {
          color: "#ffffff",
          font: { family: CHART_FONT_FAMILY, size: 10 },
          callback: (value: number | string) => toFaDigits(value),
        },
        grid: { color: "#327b3e" },
      },
    },
    plugins: {
      tooltip: {
        titleFont: { family: CHART_FONT_FAMILY },
        bodyFont: { family: CHART_FONT_FAMILY },
        callbacks: {
          label: (context: TooltipItem<"line">) =>
            `${toFaDigits(context.parsed.y ?? 0)} کیلوگرم`,
        },
      },
    },
  };

  return (
    <>
      <div className="glass-panel rounded-2xl p-5">
        <h2 className="text-lg font-semibold text-white">وزن</h2>

        {entries.length > 0 ? (
          <div className="mt-3 -ml-3 h-40">
            <Line data={chartData} options={chartOptions} />
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-white/70">
            هنوز وزنی ثبت نکردی.
          </p>
        )}

        <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
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

          <div className="flex w-full items-center justify-between">
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

        <button
          onClick={() => navigate("/settings/weight")}
          className="glass-tap mt-4 w-full rounded-xl bg-avocado-yellow/20 py-2 text-sm font-semibold text-avocado-yellow"
        >
          + افزودن وزن جدید
        </button>
      </div>

      {/* Rendered as a sibling of the card, not nested inside it — CSS
          :active bubbles up to ancestors, so a press inside a fixed-position
          modal nested within a .glass-panel card would also transform that
          card (its :active press-scale), which makes the card a containing
          block for the modal's own fixed positioning and breaks its
          click-through once the page has scrolled. */}
      <TargetWeightModal
        open={targetModalOpen}
        onClose={() => setTargetModalOpen(false)}
        onSaved={() => setVersion((v) => v + 1)}
      />
    </>
  );
}
