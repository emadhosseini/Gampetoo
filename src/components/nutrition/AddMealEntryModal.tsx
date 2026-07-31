import { useState } from "react";
import { X } from "lucide-react";

import type { MealSlot } from "@/data/nutrition/foodCatalog";
import {
  addLoggedEntry,
  getLoggedEntries,
  removeLoggedEntry,
} from "@/utils/dailyLogEngine";
import { toFaDigits } from "@/utils/numberFormat";

export interface AddMealEntryModalProps {
  meal: MealSlot | null;
  onClose: () => void;
  // Bumped after every add/remove so the card behind the modal (whose own
  // state was read before the modal opened) shows the fresh totals once
  // this closes — there's no shared reactive store to push the change
  // through automatically.
  onChange: () => void;
}

export default function AddMealEntryModal({
  meal,
  onClose,
  onChange,
}: AddMealEntryModalProps) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [calories, setCalories] = useState("");

  if (!meal) {
    return null;
  }

  const entries = getLoggedEntries(meal.id);

  function handleAdd() {
    const trimmedName = name.trim();

    if (!trimmedName) return;

    addLoggedEntry(meal!.id, {
      name: trimmedName,
      amount: amount.trim() || undefined,
      calories: calories.trim() ? Number(calories) : undefined,
    });

    setName("");
    setAmount("");
    setCalories("");
    onChange();
  }

  function handleRemove(entryId: string) {
    removeLoggedEntry(meal!.id, entryId);
    onChange();
  }

  return (
    <div
      className="pt-safe fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-forest-600 bg-forest-700 p-6 shadow-2xl"
      >
        <h2 className="text-center text-lg font-bold text-white">
          افزودن به {meal.title}
        </h2>

        {entries.length > 0 && (
          <div className="max-h-40 space-y-2 overflow-y-auto">
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
        )}

        <div className="space-y-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسم خوردنی"
            className="glass-chip w-full rounded-xl p-3 text-center text-white"
          />

          <div className="flex gap-2">
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="مقدار (اختیاری)"
              className="glass-chip w-full flex-1 rounded-xl p-3 text-center text-white"
            />

            <input
              type="number"
              inputMode="numeric"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="کالری (اختیاری)"
              className="glass-chip w-full flex-1 rounded-xl p-3 text-center text-white"
            />
          </div>
        </div>

        <button
          onClick={handleAdd}
          disabled={!name.trim()}
          className="glass-tap w-full rounded-2xl bg-avocado-yellow py-3 font-bold text-black disabled:cursor-not-allowed disabled:opacity-40"
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
