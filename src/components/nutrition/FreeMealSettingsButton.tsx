import { ChevronRight, Minus, Plus } from "lucide-react";
import { useState } from "react";

import ModalOverlay from "@/components/ModalOverlay";
import {
  getWeeklyFreeMealCount,
  setWeeklyFreeMealCount,
} from "@/utils/freeMealEngine";
import { toFaDigits } from "@/utils/numberFormat";

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
        <ModalOverlay onClose={() => setOpen(false)}>
          <div className="glass-panel glass-static rounded-3xl p-6 text-center">
            <h2 className="text-lg font-bold text-white">
              تعداد وعده آزاد هفته خودتو مشخص کن
            </h2>

            <div className="selector-pill mx-auto mt-5 flex max-w-[180px] items-center justify-between rounded-xl p-2">
              <button
                onClick={() => setCount((prev) => Math.max(1, prev - 1))}
              >
                <Minus size={18} />
              </button>

              <span className="font-bold text-white">{toFaDigits(count)}</span>

              <button onClick={() => setCount((prev) => prev + 1)}>
                <Plus size={18} />
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={handleSave}
                className="w-full rounded-2xl glass-action py-3 font-bold text-white"
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
        </ModalOverlay>
      )}
    </>
  );
}
