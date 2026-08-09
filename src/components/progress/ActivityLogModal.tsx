import { useState } from "react";
import { Minus, Plus } from "lucide-react";

import ModalOverlay from "@/components/ModalOverlay";
import { toFaDigits } from "@/utils/numberFormat";

// A small nudge for quick taps, not the only way to change the number —
// the figure itself is a real input now, so an exact value (say 137) is
// typed directly instead of tapped out fifty at a time.
const STEP = 10;
const DEFAULT_CALORIES = 200;

export interface ActivityLogModalProps {
  open: boolean;
  onClose: () => void;
  onLog: (calories: number, note: string) => void;
}

export default function ActivityLogModal({ open, onClose, onLog }: ActivityLogModalProps) {
  const [calories, setCalories] = useState(DEFAULT_CALORIES);
  const [note, setNote] = useState("");

  if (!open) {
    return null;
  }

  function handleSave() {
    onLog(calories, note);
    setNote("");
    onClose();
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-panel glass-static space-y-4 rounded-3xl p-6 text-center">
        <h2 className="text-lg font-bold text-white">ثبت فعالیت</h2>

        <p className="text-sm text-white/60">چند کالری سوزوندی؟</p>

        <div className="selector-pill flex items-center justify-between rounded-xl p-3">
          <button
            onClick={() => setCalories((c) => Math.max(0, c - STEP))}
            aria-label="کم کردن"
          >
            <Minus size={20} />
          </button>

          {/* A direct-entry field, not just a read-only number the
              stepper buttons move — typing the exact figure is a lot
              faster than tapping a ±10 button toward it from 200. */}
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={calories}
            onChange={(e) => setCalories(Math.max(0, Number(e.target.value) || 0))}
            className="w-20 bg-transparent text-center text-2xl font-bold text-white outline-none"
          />

          <button onClick={() => setCalories((c) => c + STEP)} aria-label="زیاد کردن">
            <Plus size={20} />
          </button>
        </div>

        <p className="text-center text-xs text-white/50">{toFaDigits(calories)} کالری</p>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="چه فعالیتی بود؟ (اختیاری) — مثلاً دوچرخه‌سواری ۳۰ دقیقه"
          rows={3}
          className="glass-chip w-full resize-none rounded-xl p-3 text-right text-sm text-white placeholder:text-white/40 outline-none"
        />

        <button
          onClick={handleSave}
          disabled={calories <= 0}
          className="w-full glass-action rounded-2xl py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          ثبت
        </button>

        <button
          onClick={onClose}
          className="ghost-action w-full rounded-2xl py-3 font-medium text-white"
        >
          بستن
        </button>
      </div>
    </ModalOverlay>
  );
}
