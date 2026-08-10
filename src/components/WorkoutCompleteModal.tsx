import { Flame } from "lucide-react";

import ModalOverlay from "@/components/ModalOverlay";
import Toggle from "@/components/Toggle";
import WorkoutSummary from "@/components/WorkoutSummary";
import { toFaDigits } from "@/utils/numberFormat";

export interface WorkoutCompleteModalProps {
  open: boolean;
  workoutTitle: string;
  exercises: number;
  sets: number;
  // Estimated burn for the exercises actually checked off. Zero when none
  // were, in which case there's nothing to decide and the block below is
  // left out entirely.
  calories: number;
  addToActivity: boolean;
  onToggleAddToActivity: () => void;
  // Cancelling doesn't just close the modal — the slide button behind it
  // needs to reset back to its start position too (the caller does this,
  // typically by remounting SlideToCompleteButton via a changing key).
  onCancel: () => void;
  onConfirm: () => void;
}

export default function WorkoutCompleteModal({
  open,
  workoutTitle,
  exercises,
  sets,
  calories,
  addToActivity,
  onToggleAddToActivity,
  onCancel,
  onConfirm,
}: WorkoutCompleteModalProps) {
  if (!open) {
    return null;
  }

  return (
    <ModalOverlay onClose={onCancel}>
      <div className="glass-panel glass-static max-h-[85vh] space-y-4 overflow-y-auto rounded-3xl p-6 text-center">
        <h2 className="text-lg font-bold text-white">{workoutTitle}</h2>

        <p className="text-sm text-white/70">خلاصه تمرین امروز</p>

        <WorkoutSummary exercises={exercises} sets={sets} />

        {/* The one moment this estimate is worth showing: the workout is
            over, so the number is final, and the user is deciding about it
            rather than watching it creep up mid-workout. */}
        {calories > 0 && (
          <div className="glass-panel glass-static space-y-3 rounded-3xl p-5">
            <div className="flex items-center justify-center gap-2 text-white">
              <Flame size={18} />
              <span className="text-sm opacity-70">کالری سوخته‌شده</span>
            </div>

            <p className="text-2xl font-bold text-white">
              {toFaDigits(calories)}
            </p>

            <div className="glass-chip glass-static flex items-center gap-3 rounded-2xl p-3 text-right">
              <span className="flex-1 text-sm text-white">
                به کالری سوخته‌شده‌ی امروز اضافه بشه
              </span>

              <Toggle checked={addToActivity} onChange={onToggleAddToActivity} />
            </div>

            <p className="text-xs leading-relaxed text-white/60">
              این عدد تخمینیه، نه اندازه‌گیری واقعی — بر اساس فرمول استاندارد
              MET، وزن ثبت‌شده‌ات و یک مدت‌زمان تقریبی برای هر ست حساب شده.
              بسته به شدت تمرینت و بدن خودت می‌تونه کم‌وبیش فرق کنه.
            </p>
          </div>
        )}

        <button
          onClick={onConfirm}
          className="w-full glass-action glass-action-static rounded-2xl py-3 font-bold text-white"
        >
          تایید
        </button>

        <button
          onClick={onCancel}
          className="ghost-action ghost-action-static w-full rounded-2xl py-3 font-medium text-white"
        >
          انصراف
        </button>
      </div>
    </ModalOverlay>
  );
}
