import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";

import { getActiveProgram, updateProgram } from "@/utils/programEngine";
import {
  getMealSlots,
  foodCatalog,
  type FoodCatalogEntry,
} from "@/data/nutrition/foodCatalog";

import type { MealPlan, MealPlanType, MealSection } from "@/types/nutrition";

const typeTitles: Record<MealPlanType, string> = {
  workout: "برنامه غذایی روزهای تمرین",
  rest: "برنامه غذایی روزهای استراحت",
};

function parseQuantity(amount: string, fallback: number): number {
  const match = amount.match(/^(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : fallback;
}

function buildInitialPlan(type: MealPlanType): MealPlan {
  const program = getActiveProgram();
  const existing = program.nutrition[type];

  const existingById = new Map(
    existing.meals.map((meal) => [meal.id, meal]),
  );

  const meals: MealSection[] = getMealSlots().map((slot) => {
    const found = existingById.get(slot.id);

    if (found) {
      return {
        ...found,
        foods: found.foods.map((food) => ({ ...food })),
      };
    }

    return {
      id: slot.id,
      title: slot.title,
      icon: slot.icon,
      foods: [],
      enabled: false,
    };
  });

  return { ...existing, meals };
}

export default function NutritionPlanDetailPage() {
  const { type: rawType } = useParams();

  const type: MealPlanType | null =
    rawType === "workout" || rawType === "rest" ? rawType : null;

  const [plan, setPlan] = useState<MealPlan | null>(() =>
    type ? buildInitialPlan(type) : null,
  );

  const [openMealId, setOpenMealId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (!type || !plan) {
    return (
      <div className="py-10 text-center">
        برنامه غذایی پیدا نشد.
      </div>
    );
  }

  function toggleMealEnabled(mealId: string) {
    setSaved(false);

    setPlan((prev) =>
      prev && {
        ...prev,
        meals: prev.meals.map((meal) =>
          meal.id !== mealId
            ? meal
            : { ...meal, enabled: !(meal.enabled ?? true) },
        ),
      },
    );
  }

  function toggleFood(mealId: string, entry: FoodCatalogEntry) {
    setSaved(false);

    setPlan((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        meals: prev.meals.map((meal) => {
          if (meal.id !== mealId) return meal;

          const exists = meal.foods.some(
            (food) => food.name === entry.name,
          );

          return {
            ...meal,
            foods: exists
              ? meal.foods.filter((food) => food.name !== entry.name)
              : [
                  ...meal.foods,
                  {
                    id: entry.name,
                    name: entry.name,
                    amount: entry.defaultAmount,
                    calories: entry.calories,
                  },
                ],
          };
        }),
      };
    });
  }

  function updateFoodQuantity(
    mealId: string,
    entry: FoodCatalogEntry,
    quantity: number,
  ) {
    setSaved(false);

    setPlan((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        meals: prev.meals.map((meal) => {
          if (meal.id !== mealId) return meal;

          return {
            ...meal,
            foods: meal.foods.map((food) => {
              if (food.name !== entry.name) return food;

              const calories =
                entry.calories !== undefined && entry.defaultQuantity
                  ? Math.round(
                      (entry.calories / entry.defaultQuantity) * quantity,
                    )
                  : entry.calories;

              return {
                ...food,
                amount: `${quantity} ${entry.unit}`,
                calories,
              };
            }),
          };
        }),
      };
    });
  }

  function handleSave() {
    if (!plan) return;

    const program = getActiveProgram();

    updateProgram({
      ...program,
      nutrition:
        type === "workout"
          ? { ...program.nutrition, workout: plan }
          : { ...program.nutrition, rest: plan },
    });

    setSaved(true);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-center text-2xl font-bold text-white">
        {typeTitles[type]}
      </h1>

      <div className="space-y-3">
        {plan.meals.map((meal) => {
          const isOpen = openMealId === meal.id;
          const enabled = meal.enabled ?? true;

          return (
            <div
              key={meal.id}
              className="rounded-2xl border border-navy-600 bg-navy-700 p-4"
            >
              <div className="grid grid-cols-[24px_1fr_24px] items-center gap-2">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={() => toggleMealEnabled(meal.id)}
                  className="h-5 w-5"
                />

                <button
                  onClick={() =>
                    setOpenMealId(isOpen ? null : meal.id)
                  }
                  className="flex items-center justify-center gap-2"
                >
                  <span className="text-xl">{meal.icon}</span>

                  <span className="font-semibold text-white">
                    {meal.title}
                  </span>
                </button>

                <button
                  onClick={() =>
                    setOpenMealId(isOpen ? null : meal.id)
                  }
                >
                  <ChevronDown
                    className={`h-5 w-5 text-zinc-400 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {isOpen && (
                <div className="mt-4 space-y-2">
                  {foodCatalog.map((entry) => {
                    const selected = meal.foods.find(
                      (food) => food.name === entry.name,
                    );

                    return (
                      <div
                        key={entry.name}
                        className="flex items-center gap-3 rounded-xl border border-navy-600 p-3"
                      >
                        <input
                          type="checkbox"
                          checked={!!selected}
                          onChange={() => toggleFood(meal.id, entry)}
                          className="h-5 w-5 shrink-0"
                        />

                        <span className="flex-1 text-sm text-zinc-100">
                          {entry.name}
                        </span>

                        {selected && selected.calories !== undefined && (
                          <span className="text-sm text-orange-400">
                            {selected.calories} کیلوکالری
                          </span>
                        )}

                        {selected &&
                          (entry.defaultQuantity !== null ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={0}
                                value={parseQuantity(
                                  selected.amount,
                                  entry.defaultQuantity,
                                )}
                                onChange={(e) =>
                                  updateFoodQuantity(
                                    meal.id,
                                    entry,
                                    Number(e.target.value),
                                  )
                                }
                                className="w-16 rounded-lg border border-navy-500 bg-navy-600 px-2 py-1 text-center text-sm text-white"
                              />

                              <span className="text-sm text-zinc-400">
                                {entry.unit}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-zinc-400">
                              {entry.defaultAmount}
                            </span>
                          ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={handleSave}
        className="w-full rounded-2xl bg-navy-900 py-4 text-lg font-semibold text-white"
      >
        {saved ? "ذخیره شد ✅" : "ذخیره"}
      </button>
    </div>
  );
}
