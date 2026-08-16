import { useEffect, useState } from "react";

import ModalOverlay from "@/components/ModalOverlay";
import { macrosForServing } from "@/domain/nutrition/foodSearch";
import {
  findCatalogFood,
  parseAmount,
  resolveLogSlotId,
} from "@/domain/nutrition/planFoodLogging";
import { addLoggedEntry } from "@/utils/dailyLogEngine";
import { toFaDigits } from "@/utils/numberFormat";
import type { ServingUnit } from "@/types/food";
import type { FoodItem, MealSection } from "@/types/nutrition";

export interface LogPlanFoodModalProps {
  meal: MealSection | null;
  food: FoodItem | null;
  onClose: () => void;
  // Fired after the entry is written, so the caller can report it.
  onLogged: (name: string) => void;
}

// Tapping a food inside a meal on the nutrition (plan) page opens this:
// confirm — and adjust — the amount, then it goes straight into today's
// eaten-food log. The plan's own amount is only ever a prescription, so it
// is the starting point here, never a fixed one.
//
// Two shapes of food arrive here. Most are still in the catalog, so the
// full unit dropdown is available and every macro is recomputed from the
// per-100g figures. The rest (a plan built from an external lookup that was
// never learned, a catalog row since renamed away) have nothing to recompute
// from — those scale the plan's own stored calories linearly instead, and
// the unit is fixed to whatever the plan recorded.
export default function LogPlanFoodModal({
  meal,
  food,
  onClose,
  onLogged,
}: LogPlanFoodModalProps) {
  const catalogFood = food ? findCatalogFood(food.id) : null;
  const planned = food ? parseAmount(food.amount) : null;

  // Text, not a number, for the same reason EditMealEntryModal keeps it as
  // text: an emptied field has to stay empty while it's retyped rather than
  // snapping to 0, and "۱٫۵" passes through states that aren't numbers yet.
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState<ServingUnit | null>(null);

  useEffect(() => {
    if (!food) return;

    const parsed = parseAmount(food.amount);
    const entry = findCatalogFood(food.id);

    setValue(String(parsed.quantity));
    setUnit(
      entry
        ? (entry.servingUnits.find((u) => u.label === parsed.unitLabel) ??
            entry.servingUnits[0])
        : null,
    );
  }, [food]);

  if (!meal || !food || !planned) {
    return null;
  }

  const quantity = Number(value);
  const valid = value.trim() !== "" && Number.isFinite(quantity) && quantity > 0;

  const unitLabel = unit?.label ?? planned.unitLabel;

  // Linear fallback from the plan's own numbers when there's no catalog
  // entry — same shape of math the engine uses to rescale a logged entry.
  const fallbackCalories = Math.round(
    ((food.calories ?? 0) * (valid ? quantity : planned.quantity)) /
      (planned.quantity || 1),
  );

  const macros =
    catalogFood && unit
      ? macrosForServing(catalogFood, unit, valid ? quantity : planned.quantity)
      : null;

  const previewCalories = macros
    ? macros.calories
    : fallbackCalories;

  function handleLog() {
    if (!valid || !food || !meal) return;

    const amount = `${toFaDigits(quantity)} ${unitLabel}`;

    const logged =
      catalogFood && unit
        ? macrosForServing(catalogFood, unit, quantity)
        : { calories: fallbackCalories };

    addLoggedEntry(resolveLogSlotId(meal.id), {
      name: food.name,
      amount,
      // Same fields the manual/AI add flows write, so the amount stays
      // editable from the daily-log card afterwards — see LoggedFoodEntry.
      quantity,
      unitLabel,
      base: { quantity, ...logged },
      ...logged,
    });

    onLogged(food.name);
    onClose();
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-panel glass-static space-y-4 rounded-3xl p-6">
        <h2 className="text-center text-lg font-bold text-white">
          {food.name}
        </h2>

        <p className="text-center text-sm text-white/60">
          ثبت در «{meal.title}» — مقدار رو در صورت نیاز تغییر بده
        </p>

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

          {catalogFood && unit ? (
            <select
              value={unit.label}
              onChange={(e) => {
                setUnit(
                  catalogFood.servingUnits.find(
                    (u) => u.label === e.target.value,
                  ) ?? catalogFood.servingUnits[0],
                );
              }}
              aria-label="واحد"
              className="glass-static glass-chip flex-1 rounded-lg px-2 py-2 text-sm text-white"
            >
              {catalogFood.servingUnits.map((u) => (
                <option key={u.label} value={u.label}>
                  {u.label}
                </option>
              ))}
            </select>
          ) : (
            <span className="flex-1 text-sm text-white">{unitLabel}</span>
          )}
        </div>

        <p className="text-center text-sm text-white/70">
          {toFaDigits(previewCalories)} کالری
          {macros ? ` · ${toFaDigits(macros.protein)} گرم پروتئین` : ""}
        </p>

        <button
          onClick={handleLog}
          disabled={!valid}
          className="w-full glass-action rounded-2xl py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          ثبت در غذاهای خورده‌شده
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
