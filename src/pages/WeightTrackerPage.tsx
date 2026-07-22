import { useMemo, useRef, useState } from "react";
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
import zoomPlugin from "chartjs-plugin-zoom";
import { Line } from "react-chartjs-2";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

import WeightPicker from "@/components/WeightPicker";
import {
  getLatestWeight,
  getTodaysWeight,
  getWeightLog,
  logWeight,
} from "@/utils/weightEngine";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  zoomPlugin,
);

const DEFAULT_VISIBLE_POINTS = 5;

function isoToLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);

  return new Date(y, m - 1, d);
}

function formatJalaliShort(iso: string): string {
  const jalali = new DateObject({
    date: isoToLocalDate(iso),
    calendar: persian,
    locale: persian_fa,
  });

  return `${jalali.format("D")} ${jalali.format("MMMM")}`;
}

export default function WeightTrackerPage() {
  const [entries, setEntries] = useState(() => getWeightLog());
  const [weight, setWeight] = useState(() => getLatestWeight() ?? 50);
  const [saved, setSaved] = useState(false);

  const chartRef = useRef<ChartJS<"line"> | null>(null);

  const alreadyLoggedToday = getTodaysWeight() !== null;

  function handleLog() {
    setEntries(logWeight(weight));
    setSaved(true);
  }

  const chartData = useMemo(
    () => ({
      labels: entries.map((entry) => formatJalaliShort(entry.date)),
      datasets: [
        {
          data: entries.map((entry) => entry.weight),
          borderColor: "#34d399",
          backgroundColor: "rgba(52, 211, 153, 0.15)",
          pointBackgroundColor: "#34d399",
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.3,
          fill: true,
        },
      ],
    }),
    [entries],
  );

  const initialWindow = useMemo(() => {
    const lastIndex = entries.length - 1;
    const firstVisible = Math.max(0, entries.length - DEFAULT_VISIBLE_POINTS);

    return { min: firstVisible, max: Math.max(lastIndex, 0) };
  }, [entries]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          min: initialWindow.min,
          max: initialWindow.max,
          ticks: { color: "#a1a1aa" },
          grid: { color: "#1e2542" },
        },
        y: {
          ticks: { color: "#a1a1aa" },
          grid: { color: "#1e2542" },
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context: TooltipItem<"line">) =>
              `${context.parsed.y ?? 0} کیلوگرم`,
          },
        },
        zoom: {
          pan: { enabled: true, mode: "x" as const },
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: "x" as const,
          },
          limits: {
            x: { min: 0, max: Math.max(entries.length - 1, 0), minRange: 1 },
          },
        },
      },
    }),
    [initialWindow, entries.length],
  );

  return (
    <div className="space-y-6 px-5 pb-5 pt-10">
      <h1 className="text-center text-2xl font-bold text-white">
        ثبت وزن
      </h1>

      <div className="glass-panel glass-static rounded-2xl p-4 text-center">
        <label className="mb-3 block text-sm text-zinc-400">
          {alreadyLoggedToday ? "وزن امروزت رو ویرایش کن" : "وزن امروزت رو وارد کن"}
        </label>

        <WeightPicker
          value={weight}
          onChange={(newWeight) => {
            setWeight(newWeight);
            setSaved(false);
          }}
        />

        <button
          onClick={handleLog}
          className="mt-4 w-full rounded-2xl bg-avocado-yellow py-3 text-lg font-bold text-black"
        >
          {saved ? "ثبت شد ✅" : alreadyLoggedToday ? "بروزرسانی وزن" : "ثبت وزن"}
        </button>
      </div>

      <div className="glass-panel rounded-2xl p-4">
        <p className="mb-3 text-center text-sm text-zinc-400">
          نمودار وزن
        </p>

        {entries.length === 0 ? (
          <p className="py-8 text-center text-zinc-500">
            هنوز وزنی ثبت نکردی.
          </p>
        ) : (
          <>
            <div className="h-64">
              <Line ref={chartRef} data={chartData} options={chartOptions} />
            </div>

            <p className="mt-3 text-center text-xs text-zinc-500">
              با اسکرول یا دو انگشتی زوم کن، برای دیدن وزن‌های قبلی بکش
            </p>

            <button
              onClick={() => chartRef.current?.resetZoom()}
              className="mx-auto mt-2 block text-xs text-zinc-400 underline"
            >
              بازنشانی نمودار
            </button>
          </>
        )}
      </div>
    </div>
  );
}
