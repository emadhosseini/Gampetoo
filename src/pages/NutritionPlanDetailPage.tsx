import { ChevronDown, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import { getActiveProgram, updateProgram } from "@/utils/programEngine";
import { getMealSlots } from "@/data/nutrition/foodCatalog";
import { localFoods, searchFood } from "@/domain/nutrition/foodSearch";

import type { FoodItem as FoodEntry } from "@/types/food";
import type { MealPlan, MealPlanType, MealSection } from "@/types/nutrition";

const typeTitles: Record<MealPlanType, string> = {
  workout: "برنامه غذایی روزهای تمرین",
  rest: "برنامه غذایی روزهای استراحت",
};

// Live-search only kicks in past this many characters — short queries (1-3
// chars) match too many/ambiguous entries in a small catalog, so below this
// length a search only applies once explicitly submitted via the button.
const AUTO_SEARCH_MIN_LENGTH = 3;

// How long to wait after the last keystroke before actually running a live
// search — avoids firing a network request (the external API fallback) on
// every single character while the user is still typing.
const SEARCH_DEBOUNCE_MS = 300;

const QUANTITY_PATTERN = /^(\d+(?:\.\d+)?)\s+(.+)$/;

function parseQuantity(amount: string, fallback: number): number {
  const match = amount.match(/^(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : fallback;
}

// A servingUnit string is always "<count> <unit label>" (e.g. "1 پرس",
// "100 گرم") — split it so the quantity can be edited independently of the
// unit label it's attached to.
function parseServingUnit(servingUnit: string): { quantity: number; unit: string } {
  const match = servingUnit.match(QUANTITY_PATTERN);
  return match
    ? { quantity: Number(match[1]), unit: match[2] }
    : { quantity: 1, unit: servingUnit };
}

function mealCalories(meal: MealSection): number {
  return meal.foods.reduce((sum, food) => sum + (food.calories ?? 0), 0);
}

function MealFoodList({
  meal,
  query,
  isFiltering,
  results,
  loading,
  onQueryChange,
  onSubmitSearch,
  onToggleFood,
  onUpdateQuantity,
}: {
  meal: MealSection;
  query: string;
  isFiltering: boolean;
  results: FoodEntry[];
  loading: boolean;
  onQueryChange: (value: string) => void;
  onSubmitSearch: () => void;
  onToggleFood: (entry: FoodEntry) => void;
  onUpdateQuantity: (entry: FoodEntry, quantity: number) => void;
}) {
  const visibleFoods = isFiltering ? results : localFoods;

  return (
    <div className="mt-4 space-y-2">
      <div className="glass-chip flex items-center gap-2 rounded-xl p-2">
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmitSearch();
          }}
          placeholder="جستجوی غذا..."
          className="flex-1 bg-transparent px-2 py-2 text-sm text-white placeholder:text-white/50 outline-none"
        />

        <button
          onClick={onSubmitSearch}
          aria-label="جستجو"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-avocado-yellow text-black"
        >
          <Search size={16} />
        </button>
      </div>

      {isFiltering && loading && (
        <p className="py-3 text-center text-sm text-white">در حال جستجو...</p>
      )}

      {isFiltering && !loading && visibleFoods.length === 0 && (
        <p className="py-3 text-center text-sm text-white">غذایی پیدا نشد.</p>
      )}

      {(!isFiltering || !loading) &&
        visibleFoods.map((entry) => {
          const selected = meal.foods.find((food) => food.id === entry.id);
          const { quantity: defaultQuantity, unit } = parseServingUnit(
            entry.servingUnit,
          );

          return (
            <div
              key={entry.id}
              className="glass-chip glass-static flex items-center gap-3 rounded-xl p-3"
            >
              <input
                type="checkbox"
                checked={!!selected}
                onChange={() => onToggleFood(entry)}
                className="h-5 w-5 shrink-0"
              />

              <span className="flex-1 text-sm text-white">{entry.nameFa}</span>

              {selected && selected.calories !== undefined && (
                <span className="text-sm font-semibold text-white">
                  {selected.calories} کیلوکالری
                </span>
              )}

              {selected && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={parseQuantity(selected.amount, defaultQuantity)}
                    onChange={(e) =>
                      onUpdateQuantity(entry, Number(e.target.value))
                    }
                    className="w-16 rounded-lg border border-forest-500 bg-forest-600 px-2 py-1 text-center text-sm text-white"
                  />

                  <span className="text-sm text-white">{unit}</span>
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
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

  // Per-meal search text, and which meals have had a search explicitly
  // submitted (via the button) — once true, that meal keeps filtering live
  // regardless of query length, until the box is cleared back to empty.
  const [mealQueries, setMealQueries] = useState<Record<string, string>>({});
  const [searchActive, setSearchActive] = useState<Record<string, boolean>>(
    {},
  );
  const [mealResults, setMealResults] = useState<Record<string, FoodEntry[]>>(
    {},
  );
  const [mealLoading, setMealLoading] = useState<Record<string, boolean>>({});

  // Guards against a slower, stale search response overwriting a newer one
  // when the user keeps typing before the previous request resolves.
  const searchRequestId = useRef<Record<string, number>>({});
  const searchTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );

  useEffect(() => {
    const timers = searchTimers.current;
    return () => {
      Object.values(timers).forEach((timer) => clearTimeout(timer));
    };
  }, []);

  async function runMealSearch(mealId: string, query: string) {
    const requestId = (searchRequestId.current[mealId] ?? 0) + 1;
    searchRequestId.current[mealId] = requestId;

    setMealLoading((prev) => ({ ...prev, [mealId]: true }));

    const { results } = await searchFood(query);

    if (searchRequestId.current[mealId] !== requestId) return;

    setMealResults((prev) => ({ ...prev, [mealId]: results }));
    setMealLoading((prev) => ({ ...prev, [mealId]: false }));
  }

  function setMealQuery(mealId: string, value: string) {
    setMealQueries((prev) => ({ ...prev, [mealId]: value }));

    if (searchTimers.current[mealId]) {
      clearTimeout(searchTimers.current[mealId]);
    }

    const trimmed = value.trim();

    if (trimmed.length === 0) {
      setSearchActive((prev) => ({ ...prev, [mealId]: false }));
      setMealResults((prev) => ({ ...prev, [mealId]: [] }));
      return;
    }

    if (trimmed.length > AUTO_SEARCH_MIN_LENGTH) {
      searchTimers.current[mealId] = setTimeout(() => {
        void runMealSearch(mealId, trimmed);
      }, SEARCH_DEBOUNCE_MS);
    }
  }

  function submitMealSearch(mealId: string, query: string) {
    if (searchTimers.current[mealId]) {
      clearTimeout(searchTimers.current[mealId]);
    }

    setSearchActive((prev) => ({ ...prev, [mealId]: true }));
    void runMealSearch(mealId, query);
  }

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

  function toggleFood(mealId: string, entry: FoodEntry) {
    setSaved(false);

    setPlan((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        meals: prev.meals.map((meal) => {
          if (meal.id !== mealId) return meal;

          const exists = meal.foods.some((food) => food.id === entry.id);

          const foods = exists
            ? meal.foods.filter((food) => food.id !== entry.id)
            : [
                ...meal.foods,
                {
                  id: entry.id,
                  name: entry.nameFa,
                  amount: entry.servingUnit,
                  calories: entry.calories,
                },
              ];

          return {
            ...meal,
            // Selecting a food is enough to include the meal, and emptying it
            // back out drops it again — no separate checkbox step needed
            // either way. Still manually overridable via the meal checkbox.
            enabled: foods.length > 0,
            foods,
          };
        }),
      };
    });
  }

  function updateFoodQuantity(
    mealId: string,
    entry: FoodEntry,
    quantity: number,
  ) {
    setSaved(false);

    const { quantity: defaultQuantity, unit } = parseServingUnit(
      entry.servingUnit,
    );

    setPlan((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        meals: prev.meals.map((meal) => {
          if (meal.id !== mealId) return meal;

          return {
            ...meal,
            foods: meal.foods.map((food) => {
              if (food.id !== entry.id) return food;

              const calories = Math.round(
                (entry.calories / defaultQuantity) * quantity,
              );

              return {
                ...food,
                amount: `${quantity} ${unit}`,
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
          const calories = mealCalories(meal);

          return (
            <div
              key={meal.id}
              className="glass-panel glass-static rounded-2xl p-4"
            >
              <div className="grid grid-cols-[24px_1fr_auto_24px] items-center gap-2">
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

                {calories > 0 && (
                  <span className="whitespace-nowrap text-sm font-medium text-white">
                    {calories} کیلوکالری
                  </span>
                )}

                <button
                  onClick={() =>
                    setOpenMealId(isOpen ? null : meal.id)
                  }
                >
                  <ChevronDown
                    className={`h-5 w-5 text-zinc-200 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {isOpen && (
                <MealFoodList
                  meal={meal}
                  query={mealQueries[meal.id] ?? ""}
                  isFiltering={
                    searchActive[meal.id] ||
                    (mealQueries[meal.id] ?? "").trim().length >
                      AUTO_SEARCH_MIN_LENGTH
                  }
                  results={mealResults[meal.id] ?? []}
                  loading={mealLoading[meal.id] ?? false}
                  onQueryChange={(value) => setMealQuery(meal.id, value)}
                  onSubmitSearch={() =>
                    submitMealSearch(meal.id, mealQueries[meal.id] ?? "")
                  }
                  onToggleFood={(entry) => toggleFood(meal.id, entry)}
                  onUpdateQuantity={(entry, quantity) =>
                    updateFoodQuantity(meal.id, entry, quantity)
                  }
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="glass-panel rounded-2xl p-4 text-center">
        <p className="text-sm text-white">
          مجموع کالری روز
        </p>

        <p className="mt-1 text-xl font-bold text-white">
          {plan.meals
            .filter((meal) => meal.enabled ?? true)
            .reduce((sum, meal) => sum + mealCalories(meal), 0)}{" "}
          کیلوکالری
        </p>
      </div>

      <button
        onClick={handleSave}
        className="glass-tap w-full rounded-2xl bg-avocado-yellow py-4 text-lg font-bold text-black"
      >
        {saved ? "ذخیره شد ✅" : "ذخیره"}
      </button>
    </div>
  );
}
