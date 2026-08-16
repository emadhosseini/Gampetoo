import { useEffect, useMemo, useState } from "react";

import ModalOverlay from "@/components/ModalOverlay";
import { macrosForServing } from "@/domain/nutrition/foodSearch";
import {
  findCatalogFood,
  findSeedFoodMacros,
  macrosFromCalories,
  parseAmount,
  resolveLogSlotId,
} from "@/domain/nutrition/planFoodLogging";
import { addLoggedEntry, type EntryMacros } from "@/utils/dailyLogEngine";
import { toFaDigits } from "@/utils/numberFormat";
import type { FoodItem as CatalogFood, ServingUnit } from "@/types/food";
import type { FoodItem, MealSection } from "@/types/nutrition";

export interface LogPlanFoodModalProps {
  meal: MealSection | null;
  food: FoodItem | null;
  onClose: () => void;
  // Fired after the entry is written, so the caller can report it.
  onLogged: (name: string) => void;
}

// Where a planned food's macros come from, best source first. Getting this
// right is the whole point of the screen: an entry logged with calories
// alone leaves every macro chart flat no matter how much you ate.
//
//  - "serving": the food is in the catalog AND the plan's unit is one the
//    catalog counts it in, so every macro is recomputed from the per-100g
//    figures for whatever amount is currently typed. Fully accurate, and
//    the unit stays switchable.
//  - "plan": the plan itself recorded the macros when it was built (see
//    types/nutrition FoodItem) — scaled linearly off the planned amount.
//  - "composition": catalog match with a unit the catalog doesn't know
//    (the hand-written default plans count تخم مرغ in عدد, جو دوسر in
//    گرم). Calories are the figure both sides agree on, so the macros are
//    derived from them — see macrosFromCalories.
//  - "calories": nothing to go on but the plan's own calorie figure. The
//    modal says so out loud rather than quietly logging zeros.
type MacroSource = "serving" | "plan" | "composition" | "calories";

function planMacros(food: FoodItem): EntryMacros | null {
  return food.protein === undefined &&
    food.carbs === undefined &&
    food.fat === undefined
    ? null
    : {
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        fiber: food.fiber,
      };
}

function scaleMacros(macros: EntryMacros, ratio: number): EntryMacros {
  const scale = (value: number | undefined) =>
    value === undefined ? undefined : Math.round(value * ratio);

  return {
    calories: scale(macros.calories),
    protein: scale(macros.protein),
    carbs: scale(macros.carbs),
    fat: scale(macros.fat),
    fiber: scale(macros.fiber),
  };
}

// Tapping a food inside a meal on the nutrition (plan) page opens this:
// confirm — and adjust — the amount, then it goes straight into today's
// eaten-food log. The plan's own amount is only ever a prescription, so it
// is the starting point here, never a fixed one.
export default function LogPlanFoodModal({
  meal,
  food,
  onClose,
  onLogged,
}: LogPlanFoodModalProps) {
  const planned = food ? parseAmount(food.amount) : null;

  const catalogFood = useMemo<CatalogFood | null>(
    () => (food ? findCatalogFood(food.id, food.name) : null),
    [food],
  );

  // Text, not a number, for the same reason EditMealEntryModal keeps it as
  // text: an emptied field has to stay empty while it's retyped rather than
  // snapping to 0, and "۱٫۵" passes through states that aren't numbers yet.
  const [value, setValue] = useState("");
  // Non-null only when the catalog knows the plan's unit — that's what makes
  // per-serving recomputation (and the unit dropdown) meaningful at all.
  const [unit, setUnit] = useState<ServingUnit | null>(null);

  useEffect(() => {
    if (!food) return;

    const parsed = parseAmount(food.amount);
    const entry = findCatalogFood(food.id, food.name);

    setValue(String(parsed.quantity));
    setUnit(
      entry?.servingUnits.find((u) => u.label === parsed.unitLabel) ?? null,
    );
  }, [food]);

  if (!meal || !food || !planned) {
    return null;
  }

  const quantity = Number(value);
  const valid = value.trim() !== "" && Number.isFinite(quantity) && quantity > 0;
  const effectiveQuantity = valid ? quantity : planned.quantity;

  const unitLabel = unit?.label ?? planned.unitLabel;
  const ratio = effectiveQuantity / (planned.quantity || 1);

  // The plan's own macros, or — for a plan copied out of the built-in ones
  // before those carried any — the seed plan's, rescaled to whatever calorie
  // figure this copy holds.
  const fromPlan =
    planMacros(food) ?? findSeedFoodMacros(food.id, food.calories ?? 0);

  const source: MacroSource =
    catalogFood && unit
      ? "serving"
      : fromPlan
        ? "plan"
        : catalogFood
          ? "composition"
          : "calories";

  const macros: EntryMacros =
    source === "serving"
      ? macrosForServing(catalogFood!, unit!, effectiveQuantity)
      : source === "plan"
        ? scaleMacros(fromPlan!, ratio)
        : source === "composition"
          ? macrosFromCalories(catalogFood!, (food.calories ?? 0) * ratio)
          : { calories: Math.round((food.calories ?? 0) * ratio) };

  function handleLog() {
    if (!valid || !food || !meal) return;

    addLoggedEntry(resolveLogSlotId(meal.id), {
      name: food.name,
      amount: `${toFaDigits(quantity)} ${unitLabel}`,
      // Same fields the manual/AI add flows write, so the amount stays
      // editable from the daily-log card afterwards — see LoggedFoodEntry.
      quantity,
      unitLabel,
      base: { quantity, ...macros },
      ...macros,
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
          {toFaDigits(macros.calories ?? 0)} کالری
          {macros.protein !== undefined &&
            ` · ${toFaDigits(macros.protein)} گرم پروتئین`}
          {macros.carbs !== undefined &&
            ` · ${toFaDigits(macros.carbs)} گرم کربوهیدرات`}
          {macros.fat !== undefined && ` · ${toFaDigits(macros.fat)} گرم چربی`}
        </p>

        {source === "calories" && (
          <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-300">
            ارزش غذایی این مورد ثبت نشده — فقط کالریش به آمار روز اضافه می‌شه.
          </p>
        )}

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
