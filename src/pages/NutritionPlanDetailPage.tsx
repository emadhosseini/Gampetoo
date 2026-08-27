import { ChevronDown, FileText, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import PlanTextImportModal from "@/components/nutrition/PlanTextImportModal";
import Toggle from "@/components/Toggle";
import { getActiveProgram, updateProgram } from "@/utils/programEngine";
import { getMealSlots } from "@/data/nutrition/foodCatalog";
import {
  AUTO_SEARCH_MIN_LENGTH,
  SEARCH_DEBOUNCE_MS,
  localFoods,
  macrosForServing,
  searchFood,
  searchSupplements,
  supplementFoods,
} from "@/domain/nutrition/foodSearch";
import { sortFoodsForMeal } from "@/domain/nutrition/mealFoodSuggestions";
import { findCatalogFood, parseAmount } from "@/domain/nutrition/planFoodLogging";
import { toFaDigits } from "@/utils/numberFormat";

const SUPPLEMENTS_MEAL_ID = "supplements";

import type { FoodItem as FoodEntry, ServingUnit } from "@/types/food";
import type {
  FoodItem as PlanFoodItem,
  MealPlan,
  MealPlanType,
  MealSection,
} from "@/types/nutrition";

const typeTitles: Record<MealPlanType, string> = {
  workout: "برنامه غذایی روزهای تمرین",
  rest: "برنامه غذایی روزهای استراحت",
};

function mealCalories(meal: MealSection): number {
  return meal.foods.reduce((sum, food) => sum + (food.calories ?? 0), 0);
}

// A selected plan food that isn't in the currently browsable list at all —
// found via search (local or external), added, and then the search box was
// cleared or retyped into something else. The browsable list is otherwise
// built strictly from the catalog (localFoods, or whatever the live search
// returned a moment ago), which never included it, so it simply vanished:
// not failed to float to the top, just gone, with nothing to toggle back
// off short of deleting the whole meal.
//
// Resolved back to a real catalog entry first (matched by id or by name —
// see findCatalogFood, built for exactly this "plan food outlived its
// catalog row" case) so quantity changes still scale off real per-100g
// macros. Only when that fails is a synthetic one-serving entry built from
// whatever macros the plan food already has, so it's at least visible and
// removable.
function resolveMissingSelectedFood(food: PlanFoodItem): FoodEntry {
  const catalog = findCatalogFood(food.id, food.name);

  if (catalog) return catalog;

  const { unitLabel } = parseAmount(food.amount);

  return {
    id: food.id,
    nameFa: food.name,
    nameEn: food.name,
    category: "main_dish",
    servingUnits: [{ label: unitLabel, grams: 100 }],
    caloriesPer100g: food.calories ?? 0,
    proteinPer100g: food.protein ?? 0,
    carbsPer100g: food.carbs ?? 0,
    fatPer100g: food.fat ?? 0,
    fiberPer100g: food.fiber,
  };
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
  onUpdateQuantity: (entry: FoodEntry, quantity: number, unit: ServingUnit) => void;
}) {
  const isSupplementsMeal = meal.id === SUPPLEMENTS_MEAL_ID;

  const suggestedFoods = useMemo(
    () => (isSupplementsMeal ? supplementFoods : sortFoodsForMeal(localFoods, meal.id)),
    [meal.id, isSupplementsMeal],
  );
  const baseVisibleFoods = isFiltering ? results : suggestedFoods;

  // A selected food that isn't anywhere in baseVisibleFoods — found via
  // search, added, and now the search box is cleared or holds a different
  // query. Without this it doesn't fail to float to the top, it just isn't
  // rendered at all — see resolveMissingSelectedFood.
  const missingSelected = meal.foods
    .filter((food) => !baseVisibleFoods.some((entry) => entry.id === food.id))
    .map(resolveMissingSelectedFood);

  const unsortedVisibleFoods = [...baseVisibleFoods, ...missingSelected];

  // Already-selected foods float to the top of the list (search results or
  // suggestions alike) — otherwise a food you picked can scroll out of
  // view under everything else, with nothing marking where it went.
  // A stable sort, so the relative order within "selected" and within
  // "not selected" stays whatever it already was.
  const selectedIds = new Set(meal.foods.map((food) => food.id));

  const visibleFoods = [...unsortedVisibleFoods].sort(
    (a, b) => Number(selectedIds.has(b.id)) - Number(selectedIds.has(a.id)),
  );

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
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg glass-action text-white"
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

      {/* The catalog runs to hundreds of foods — left to grow freely it
          pushed every meal below it kilometers down the page, so the list
          gets its own bounded, scrollable box instead. Tall enough (~5 rows)
          to browse in, short enough that the meals below stay reachable.
          The already-selected-first sort above is what makes a bounded box
          safe: what you picked is always at the top of it. */}
      <div className="max-h-76 space-y-2 overflow-y-auto overscroll-contain pl-1">
        {(!isFiltering || !loading) &&
        visibleFoods.map((entry) => {
          const selected = meal.foods.find((food) => food.id === entry.id);
          const parsed = selected ? parseAmount(selected.amount) : null;
          const selectedUnit =
            (parsed &&
              entry.servingUnits.find((u) => u.label === parsed.unitLabel)) ??
            entry.servingUnits[0];
          const quantity = parsed?.quantity ?? 1;

          return (
            <div
              key={entry.id}
              className="glass-chip glass-static flex flex-wrap items-center gap-3 rounded-xl p-3"
            >
              <Toggle checked={!!selected} onChange={() => onToggleFood(entry)} />

              <span className="flex-1 text-sm font-semibold text-white">
                {entry.nameFa}
              </span>

              {selected && selected.calories !== undefined && (
                <span className="text-sm font-normal text-white">
                  {toFaDigits(selected.calories)} کیلوکالری
                </span>
              )}

              {selected && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={quantity}
                    onChange={(e) =>
                      onUpdateQuantity(entry, Number(e.target.value), selectedUnit)
                    }
                    className="w-14 glass-chip rounded-lg px-2 py-1 text-center text-sm text-white"
                  />

                  <select
                    value={selectedUnit.label}
                    onChange={(e) => {
                      const unit =
                        entry.servingUnits.find((u) => u.label === e.target.value) ??
                        entry.servingUnits[0];
                      onUpdateQuantity(entry, quantity, unit);
                    }}
                    className="glass-static glass-chip rounded-lg px-2 py-1 text-sm text-white"
                  >
                    {entry.servingUnits.map((unit) => (
                      <option key={unit.label} value={unit.label}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          );
        })}
      </div>
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
  const [importOpen, setImportOpen] = useState(false);

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

    // Supplements are a small fixed list — a plain local filter, no external
    // API lookup like the regular (much larger, open-ended) food catalog.
    const results =
      mealId === SUPPLEMENTS_MEAL_ID
        ? searchSupplements(query)
        : (await searchFood(query)).results;

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

          const defaultUnit = entry.servingUnits[0];

          const foods = exists
            ? meal.foods.filter((food) => food.id !== entry.id)
            : [
                ...meal.foods,
                {
                  id: entry.id,
                  name: entry.nameFa,
                  amount: `1 ${defaultUnit.label}`,
                  // Every macro, not just calories — this is what a food
                  // logged as eaten straight off the plan carries into the
                  // daily log and its macro charts.
                  ...macrosForServing(entry, defaultUnit, 1),
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
    unit: ServingUnit,
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
              if (food.id !== entry.id) return food;

              return {
                ...food,
                amount: `${quantity} ${unit.label}`,
                ...macrosForServing(entry, unit, quantity),
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
    <div className="space-y-6 px-5 pb-5 pt-10">
      <h1 className="text-center text-2xl font-bold text-white">
        {typeTitles[type]}
      </h1>

      {/* Writes straight to storage rather than into this page's own draft,
          so the draft is rebuilt from what was written — otherwise pressing
          ذخیره afterwards would put the pre-import plan back. */}
      <button
        onClick={() => setImportOpen(true)}
        className="glass-tap flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-semibold text-white"
      >
        <FileText size={18} />
        نوشتن برنامه با متن
      </button>

      <PlanTextImportModal
        open={importOpen}
        planType={type}
        onClose={() => setImportOpen(false)}
        onApplied={() => {
          setPlan(buildInitialPlan(type));
          setSaved(true);
        }}
      />

      {/* Same handler and label as the button at the bottom — this page's
          list of meals/foods can run long, and scrolling all the way down
          just to save shouldn't be the only way to do it. */}
      <button
        onClick={handleSave}
        className="w-full glass-action rounded-2xl py-4 text-lg font-bold text-white"
      >
        {saved ? "ذخیره شد ✅" : "ذخیره"}
      </button>

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
              <div className="grid grid-cols-[44px_1fr_auto_24px] items-center gap-2">
                <Toggle checked={enabled} onChange={() => toggleMealEnabled(meal.id)} />

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
                    {toFaDigits(calories)} کیلوکالری
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
                  onUpdateQuantity={(entry, quantity, unit) =>
                    updateFoodQuantity(meal.id, entry, quantity, unit)
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
          {toFaDigits(
            plan.meals
              .filter((meal) => meal.enabled ?? true)
              .reduce((sum, meal) => sum + mealCalories(meal), 0),
          )}{" "}
          کیلوکالری
        </p>
      </div>

      <button
        onClick={handleSave}
        className="w-full glass-action rounded-2xl py-4 text-lg font-bold text-white"
      >
        {saved ? "ذخیره شد ✅" : "ذخیره"}
      </button>
    </div>
  );
}
