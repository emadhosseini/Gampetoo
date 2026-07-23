import { ChevronRight, Minus, Plus } from "lucide-react";
import { useState } from "react";

import {
  getWeeklyFreeMealCount,
  setWeeklyFreeMealCount,
} from "@/utils/freeMealEngine";

export default function FreeMealSettingsButton() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(() => getWeeklyFreeMealCount());
  const [saved, setSaved] = useState(false);

  function openModal() {
    setCount(getWeeklyFreeMealCount());
    setSaved(false);
    setOpen(true);
  }

  function handleSave() {
    setWeeklyFreeMealCount(count);
    setSaved(true);
  }

  return (
    <>
      <button
        onClick={openModal}
        className="glass-panel flex w-full items-center justify-between rounded-2xl p-4"
      >
        <h2 className="text-lg font-semibold">🍕 وعده آزاد</h2>

        <ChevronRight className="h-5 w-5 text-zinc-200" />
      </button>

      {open && (
        <div className="pt-safe fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-forest-600 bg-forest-700 p-6 text-center shadow-2xl">
            <h2 className="text-lg font-bold text-white">
              تعداد وعده آزاد هفته خودتو مشخص کن
            </h2>

            <div className="selector-pill mx-auto mt-5 flex max-w-[180px] items-center justify-between rounded-xl p-2">
              <button
                onClick={() => setCount((prev) => Math.max(1, prev - 1))}
              >
                <Minus size={18} />
              </button>

              <span className="font-bold text-white">{count}</span>

              <button onClick={() => setCount((prev) => prev + 1)}>
                <Plus size={18} />
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={handleSave}
                className="w-full rounded-2xl bg-avocado-yellow py-3 font-bold text-black"
              >
                {saved ? "ذخیره شد ✅" : "ذخیره"}
              </button>

              <button
                onClick={() => setOpen(false)}
                className="ghost-action w-full rounded-2xl py-3 font-medium text-white"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
