import { useState } from "react";
import { Check } from "lucide-react";

import ModalOverlay from "@/components/ModalOverlay";
import { DEFAULT_VARIANT_ID, getVariants } from "@/store/workoutVariantStore";

export interface VariantAssignModalProps {
  open: boolean;
  workoutId: string | null;
  // WorkoutDay.assignedVariantIds as it stands now — empty/undefined reads
  // as "just پیش‌فرض", same as everywhere else this field is interpreted.
  initialSelected: string[] | undefined;
  onClose: () => void;
  onSave: (variantIds: string[]) => void;
}

function VariantRow({
  label,
  checked,
  onClick,
}: {
  label: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`glass-chip glass-static flex w-full items-center justify-between rounded-xl p-3 text-sm font-medium text-white ${
        checked ? "glass-chip-selected" : ""
      }`}
    >
      {label}
      {checked && <Check size={16} />}
    </button>
  );
}

// Which of a workout's saved plans (workoutVariantStore — پیش‌فرض plus
// anything created from WorkoutDetailPage's "+") a program day should
// rotate between. Picking just one here means the day always goes straight
// to it, same as before this existed; picking 2+ is what makes WorkoutPage
// ask "کدوم رو امروز انجام می‌دی؟" once that day actually arrives.
export default function VariantAssignModal({
  open,
  workoutId,
  initialSelected,
  onClose,
  onSave,
}: VariantAssignModalProps) {
  const [selected, setSelected] = useState<string[]>(
    initialSelected && initialSelected.length > 0
      ? initialSelected
      : [DEFAULT_VARIANT_ID],
  );

  if (!open || !workoutId) {
    return null;
  }

  const variants = getVariants(workoutId);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = prev.includes(id)
        ? prev.filter((v) => v !== id)
        : [...prev, id];

      // At least one plan has to stay assigned — a day with none would
      // have nothing to show up as on the home/workout pages.
      return next.length > 0 ? next : prev;
    });
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-panel glass-static space-y-4 rounded-3xl p-6 text-center">
        <h2 className="text-lg font-bold text-white">چند حالت برنامه برای این روز</h2>

        <p className="text-xs leading-6 text-white/60">
          اگه بیشتر از یکی انتخاب کنی، وقتی این روز برسه ازت می‌پرسه کدوم رو
          می‌خوای انجام بدی.
        </p>

        <div className="space-y-2">
          <VariantRow
            label="برنامه پیش‌فرض"
            checked={selected.includes(DEFAULT_VARIANT_ID)}
            onClick={() => toggle(DEFAULT_VARIANT_ID)}
          />

          {variants.map((variant) => (
            <VariantRow
              key={variant.id}
              label={variant.name}
              checked={selected.includes(variant.id)}
              onClick={() => toggle(variant.id)}
            />
          ))}
        </div>

        {variants.length === 0 && (
          <p className="text-xs text-white/50">
            هنوز پلن دیگه‌ای برای این تمرین نساختی — از صفحه‌ی خود تمرین، کنار
            «برنامه پیش‌فرض» دکمه‌ی + رو بزن.
          </p>
        )}

        <button
          onClick={() => {
            onSave(selected);
            onClose();
          }}
          className="w-full glass-action rounded-2xl py-3 font-bold text-white"
        >
          ذخیره
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
