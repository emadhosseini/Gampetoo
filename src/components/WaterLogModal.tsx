import { useState } from "react";
import { Minus, Plus } from "lucide-react";

import ModalOverlay from "@/components/ModalOverlay";
import { toFaDigits } from "@/utils/numberFormat";

const WATER_COLOR = "#38bdf8";
const DEFAULT_GLASSES = 1;
const MAX_GLASSES = 20;

export interface WaterLogModalProps {
  open: boolean;
  onClose: () => void;
  onLog: (glasses: number) => void;
}

// A trapezoid glass, always shown full here — the count sits over it as the
// thing being edited, not a live fill level.
function GlassIcon({ count }: { count: number }) {
  return (
    <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <path
          d="M 35 84 L 65 84 L 72 16 L 28 16 Z"
          fill={WATER_COLOR}
          fillOpacity="0.25"
        />

        <path
          d="M 28 16 L 72 16 L 65 84 L 35 84 Z"
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        <line
          x1="28"
          y1="16"
          x2="72"
          y2="16"
          stroke="#ffffff"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>

      <span className="absolute mt-3 text-3xl font-bold text-white">
        {toFaDigits(count)}
      </span>
    </div>
  );
}

export default function WaterLogModal({ open, onClose, onLog }: WaterLogModalProps) {
  const [glasses, setGlasses] = useState(DEFAULT_GLASSES);

  if (!open) {
    return null;
  }

  function handleSave() {
    onLog(glasses);
    onClose();
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-panel glass-static space-y-4 rounded-3xl p-6 text-center">
        <h2 className="text-lg font-bold text-white">ثبت آب</h2>

        <p className="text-sm text-white/60">چند لیوان آب خوردی؟</p>

        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => setGlasses((g) => Math.max(0, g - 1))}
            aria-label="کم کردن"
            className="glass-chip flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white"
          >
            <Minus size={20} />
          </button>

          <GlassIcon count={glasses} />

          <button
            onClick={() => setGlasses((g) => Math.min(MAX_GLASSES, g + 1))}
            aria-label="زیاد کردن"
            className="glass-chip flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white"
          >
            <Plus size={20} />
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={glasses <= 0}
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
