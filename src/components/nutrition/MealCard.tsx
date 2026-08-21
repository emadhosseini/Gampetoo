import { ChevronDown } from "lucide-react";
import { useState } from "react";

import MealItem from "./MealItem";
import type { FoodItem, MealSection } from "../../types/nutrition";
import { toFaDigits } from "@/utils/numberFormat";
import { getLoggedEntries } from "@/utils/dailyLogEngine";
import { resolveLogSlotId } from "@/domain/nutrition/planFoodLogging";
import { normalizeFa } from "@/utils/persianSearch";

interface MealCardProps {
  meal: MealSection;
  // Passed through to each food row — see MealItem. Optional so this card
  // stays usable as a plain read-only view of a meal.
  onSelectFood?: (meal: MealSection, food: FoodItem) => void;
}

export default function MealCard({ meal, onSelectFood }: MealCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Foods already logged as eaten today, under the same slot a tap here
  // would write into (see resolveLogSlotId) — matched by name, since a
  // planned food's id and a logged entry's id are never the same thing
  // (the log entry gets its own generateId() on write).
  const loggedNames = new Set(
    getLoggedEntries(resolveLogSlotId(meal.id)).map((entry) => normalizeFa(entry.name)),
  );

  // Eaten foods float to the top — same reasoning as
  // NutritionPlanDetailPage's "selected items float to top": otherwise a
  // food you already checked off scrolls out of view under everything
  // else, with nothing marking where it went. Stable, so the order within
  // "eaten" and within "not eaten" stays whatever the plan already had.
  const foods = [...meal.foods].sort(
    (a, b) =>
      Number(loggedNames.has(normalizeFa(b.name))) -
      Number(loggedNames.has(normalizeFa(a.name))),
  );

  return (
    // p-2.5, same as the collapsed row's own text-sm size below: matches
    // WeeklyScheduleModal's "تقویم هفته" button height exactly (same py-2.5
    // on a single text-sm line), so every meal reads as one compact row
    // until it's actually opened — same treatment ExerciseCard got.
    // glass-static drops the press-scale, which a card that just expands
    // in place (not a button that fires an action) shouldn't have.
    <div className="glass-panel glass-static rounded-2xl p-2.5">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="grid w-full grid-cols-[24px_1fr_24px] items-center"
      >
        <span />

        <span className="flex items-center justify-center gap-2">
          <span className="text-lg">{meal.icon}</span>

          <h2 className="text-sm font-bold text-white">{meal.title}</h2>
        </span>

        <ChevronDown
          className={`h-4 w-4 text-zinc-200 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            {foods.map((food) => (
              <MealItem
                key={food.id}
                item={food}
                eaten={loggedNames.has(normalizeFa(food.name))}
                onSelect={
                  onSelectFood ? (item) => onSelectFood(meal, item) : undefined
                }
              />
            ))}
          </div>

          {(meal.calories || meal.protein) && (
            <div className="flex items-center gap-4 pt-2 text-sm">
              {meal.calories && (
                <span className="text-white">
                  {toFaDigits(meal.calories)} کیلوکالری
                </span>
              )}

              {meal.protein && (
                <span className="font-semibold text-white">
                  {toFaDigits(meal.protein)} گرم پروتئین
                </span>
              )}
            </div>
          )}

          {meal.notes && meal.notes.length > 0 && (
            <div className="glass-chip rounded-xl p-3">
              <div className="mb-2 text-xs font-semibold text-white">
                نکات
              </div>

              <ul className="space-y-1">
                {meal.notes.map((note, index) => (
                  <li
                    key={index}
                    className="text-sm text-white"
                  >
                    • {note}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
