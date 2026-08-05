import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

import ModalOverlay from "@/components/ModalOverlay";
import type { MealSlot } from "@/data/nutrition/foodCatalog";
import { isEntryEditable, type LoggedFoodEntry } from "@/utils/dailyLogEngine";
import { toFaDigits } from "@/utils/numberFormat";

export interface EditMealEntryModalProps {
  meal: MealSlot | null;
  entry: LoggedFoodEntry | null;
  onClose: () => void;
  onSave: (quantity: number) => void;
  onRemove: () => void;
}

// Opened by tapping a food in a meal card's expanded list. Changing the
// amount here rescales that entry's calories and macros — the actual
// rescaling lives in dailyLogEngine.updateLoggedEntryQuantity, which works
// off the entry's untouched add-time basis; the preview below mirrors it so
// the number you're about to save is the number you see.
export default function EditMealEntryModal({
  meal,
  entry,
  onClose,
  onSave,
  onRemove,
}: EditMealEntryModalProps) {
  // Text, not a number: an emptied field has to stay empty while it's being
  // retyped rather than snapping to 0, and "۱٫۵" is typed one keystroke at
  // a time through states that aren't valid numbers yet.
  const [value, setValue] = useState("");

  useEffect(() => {
    setValue(entry?.quantity !== undefined ? String(entry.quantity) : "");
  }, [entry]);

  if (!meal || !entry) {
    return null;
  }

  const editable = isEntryEditable(entry);
  const quantity = Number(value);
  const valid = value.trim() !== "" && Number.isFinite(quantity) && quantity > 0;

  // Same linear scale from the same untouched basis the engine uses, so this
  // preview can't disagree with what gets written.
  const previewCalories =
    editable && valid
      ? Math.round(((entry.base!.calories ?? 0) * quantity) / entry.base!.quantity)
      : (entry.calories ?? 0);

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-panel glass-static space-y-4 rounded-3xl p-6">
        <h2 className="text-center text-lg font-bold text-white">
          {entry.name}
        </h2>

        {editable ? (
          <>
            <div className="glass-chip flex items-center gap-2 rounded-xl p-3">
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                aria-label="مقدار"
                className="w-20 glass-chip rounded-lg px-2 py-2 text-center text-sm text-white"
              />

              <span className="flex-1 text-sm text-white">
                {entry.unitLabel}
              </span>

              <span className="text-sm text-white/70">
                {toFaDigits(previewCalories)} کالری
              </span>
            </div>

            <button
              onClick={() => onSave(quantity)}
              disabled={!valid}
              className="w-full glass-action rounded-2xl py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              ذخیره
            </button>
          </>
        ) : (
          // Logged before the amount was recorded in a form that can be
          // rescaled, so there's nothing to edit — removing and re-adding
          // it is the only way to change it.
          <p className="glass-chip rounded-xl p-3 text-center text-sm text-white">
            {entry.amount ? `${entry.amount} — ` : ""}
            {toFaDigits(previewCalories)} کالری
            <span className="mt-1 block text-xs text-white/60">
              مقدار این مورد قابل ویرایش نیست؛ برای تغییرش حذفش کن و دوباره
              اضافه کن.
            </span>
          </p>
        )}

        <button
          onClick={onRemove}
          className="glass-tap flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-bold text-white"
        >
          <Trash2 size={18} />
          حذف از این وعده
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
