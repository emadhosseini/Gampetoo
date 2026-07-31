import { X } from "lucide-react";

import type { MealSlot } from "@/data/nutrition/foodCatalog";
import { getLoggedEntries, removeLoggedEntry } from "@/utils/dailyLogEngine";
import { toFaDigits } from "@/utils/numberFormat";

export interface MealOverviewModalProps {
  meal: MealSlot | null;
  onClose: () => void;
  onAdd: () => void;
  // Bumped after a removal so the card behind this modal (whose own state
  // was read before it opened) shows the fresh totals once this closes.
  onChange: () => void;
}

// Opened by tapping the whole meal card — a review of what's already been
// logged for that meal, one level up from the actual food-search screen
// (AddMealEntryModal), which only "افزودن" here drills into.
export default function MealOverviewModal({
  meal,
  onClose,
  onAdd,
  onChange,
}: MealOverviewModalProps) {
  if (!meal) {
    return null;
  }

  const entries = getLoggedEntries(meal.id);

  const totalCalories = entries.reduce(
    (sum, entry) => sum + (entry.calories ?? 0),
    0,
  );

  function handleRemove(entryId: string) {
    removeLoggedEntry(meal!.id, entryId);
    onChange();
  }

  return (
    <div
      className="pt-safe fixed inset-0 z-[70] flex items-center justify-center px-6 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-panel w-full max-w-sm space-y-4 rounded-3xl p-6"
      >
        <h2 className="text-center text-lg font-bold text-white">
          {meal.title}
        </h2>

        {entries.length === 0 ? (
          <p className="py-4 text-center text-sm text-white">
            چیزی برای این وعده ثبت نشده.
          </p>
        ) : (
          <>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="glass-chip flex items-center gap-2 rounded-xl p-3"
                >
                  <span className="flex-1 text-sm font-medium text-white">
                    {entry.name}
                    {entry.amount && (
                      <span className="mr-2 text-white/60">
                        {toFaDigits(entry.amount)}
                      </span>
                    )}
                  </span>

                  {entry.calories !== undefined && (
                    <span className="text-xs text-white/70">
                      {toFaDigits(entry.calories)} کالری
                    </span>
                  )}

                  <button
                    onClick={() => handleRemove(entry.id)}
                    aria-label={`حذف ${entry.name}`}
                    className="glass-tap flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                  >
                    <X size={14} className="text-white" />
                  </button>
                </div>
              ))}
            </div>

            <p className="text-center text-sm text-white/70">
              مجموع: {toFaDigits(totalCalories)} کیلوکالری
            </p>
          </>
        )}

        <button
          onClick={onAdd}
          className="glass-tap w-full rounded-2xl bg-avocado-yellow py-3 font-bold text-black"
        >
          افزودن
        </button>

        <button
          onClick={onClose}
          className="ghost-action w-full rounded-2xl py-3 font-medium text-white"
        >
          بستن
        </button>
      </div>
    </div>
  );
}
