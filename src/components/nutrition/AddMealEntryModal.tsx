import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";

import ModalOverlay from "@/components/ModalOverlay";
import type { MealSlot } from "@/data/nutrition/foodCatalog";
import {
  AUTO_SEARCH_MIN_LENGTH,
  SEARCH_DEBOUNCE_MS,
  caloriesForServing,
  localFoods,
  macrosForServing,
  searchFood,
  searchSupplements,
  supplementFoods,
} from "@/domain/nutrition/foodSearch";
import { sortFoodsForMeal } from "@/domain/nutrition/mealFoodSuggestions";
import { addLoggedEntry } from "@/utils/dailyLogEngine";
import { toFaDigits } from "@/utils/numberFormat";
import type { FoodItem, ServingUnit } from "@/types/food";

const SUPPLEMENTS_MEAL_ID = "supplements";

export interface AddMealEntryModalProps {
  meal: MealSlot | null;
  onClose: () => void;
  // Bumped after every add/remove so the card behind the modal (whose own
  // state was read before the modal opened) shows the fresh totals once
  // this closes — there's no shared reactive store to push the change
  // through automatically.
  onChange: () => void;
  // Which day to log against — defaults to today inside dailyLogEngine,
  // which is exactly what the quick-add flow (the other caller of this
  // modal) wants. DailyLogPage's own meal tab passes its WeeklyDatePicker
  // selection through instead.
  date?: string;
}

export default function AddMealEntryModal({
  meal,
  onClose,
  onChange,
  date,
}: AddMealEntryModalProps) {
  const [query, setQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const [results, setResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [unit, setUnit] = useState<ServingUnit | null>(null);
  const [quantity, setQuantity] = useState(1);
  // Name of the food just added, or null. Adding clears `selected` (which
  // already returns to the food list, since that's what hides the
  // quantity picker), but gave no feedback that anything happened — this
  // is a brief confirmation banner, self-clearing below.
  const [justAdded, setJustAdded] = useState<string | null>(null);

  const requestId = useRef(0);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const isSupplementsMeal = meal?.id === SUPPLEMENTS_MEAL_ID;

  const suggestedFoods = useMemo(
    () =>
      !meal
        ? []
        : isSupplementsMeal
          ? supplementFoods
          : sortFoodsForMeal(localFoods, meal.id),
    [meal, isSupplementsMeal],
  );

  const isFiltering =
    searchActive || query.trim().length > AUTO_SEARCH_MIN_LENGTH;
  const visibleFoods = isFiltering ? results : suggestedFoods;

  useEffect(() => {
    // Reset the search/selection state every time a different meal's modal
    // opens, so leftover state from the previous meal never leaks in.
    setQuery("");
    setSearchActive(false);
    setResults([]);
    setSelected(null);
    setUnit(null);
    setQuantity(1);
    setJustAdded(null);
  }, [meal]);

  useEffect(() => {
    return () => clearTimeout(debounceTimer.current);
  }, []);

  useEffect(() => {
    if (!justAdded) return;

    const timer = setTimeout(() => setJustAdded(null), 2500);

    return () => clearTimeout(timer);
  }, [justAdded]);

  async function runSearch(value: string) {
    const id = ++requestId.current;
    setLoading(true);

    const found = isSupplementsMeal
      ? searchSupplements(value)
      : (await searchFood(value)).results;

    if (requestId.current !== id) return;

    setResults(found);
    setLoading(false);
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    clearTimeout(debounceTimer.current);

    const trimmed = value.trim();

    if (!trimmed) {
      setSearchActive(false);
      setResults([]);
      return;
    }

    if (trimmed.length > AUTO_SEARCH_MIN_LENGTH) {
      debounceTimer.current = setTimeout(
        () => void runSearch(trimmed),
        SEARCH_DEBOUNCE_MS,
      );
    }
  }

  function submitSearch() {
    clearTimeout(debounceTimer.current);
    setSearchActive(true);
    void runSearch(query);
  }

  if (!meal) {
    return null;
  }

  function selectFood(entry: FoodItem) {
    setSelected(entry);
    setUnit(entry.servingUnits[0]);
    setQuantity(1);
  }

  function handleAdd() {
    if (!selected || !unit) return;

    const macros = macrosForServing(selected, unit, quantity);

    addLoggedEntry(
      meal!.id,
      {
        name: selected.nameFa,
        amount: `${toFaDigits(quantity)} ${unit.label}`,
        // Kept alongside the totals so the amount stays editable from the
        // meal card afterwards — see LoggedFoodEntry.
        quantity,
        unitLabel: unit.label,
        base: { quantity, ...macros },
        ...macros,
      },
      date,
    );

    setJustAdded(selected.nameFa);
    setSelected(null);
    setUnit(null);
    setQuantity(1);
    onChange();
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-panel glass-static max-h-[85vh] space-y-4 overflow-y-auto rounded-3xl p-6">
        <h2 className="text-center text-lg font-bold text-white">
          افزودن به وعده {meal.title}
        </h2>

        {justAdded && (
          <p className="rounded-xl bg-green-500/15 py-2 text-center text-sm font-semibold text-green-400">
            «{justAdded}» اضافه شد ✅
          </p>
        )}

        <div className="glass-chip flex items-center gap-2 rounded-xl p-2">
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitSearch();
            }}
            placeholder="جستجوی غذا..."
            className="flex-1 bg-transparent px-2 py-2 text-sm text-white placeholder:text-white/50 outline-none"
          />

          <button
            onClick={submitSearch}
            aria-label="جستجو"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg glass-action text-white"
          >
            <Search size={16} />
          </button>
        </div>

        <div className="max-h-50 space-y-2 overflow-y-auto">
          {isFiltering && loading && (
            <p className="py-2 text-center text-sm text-white">
              در حال جستجو...
            </p>
          )}

          {isFiltering && !loading && visibleFoods.length === 0 && (
            <p className="py-2 text-center text-sm text-white">
              غذایی پیدا نشد.
            </p>
          )}

          {(!isFiltering || !loading) &&
            visibleFoods.map((entry) => (
              <button
                key={entry.id}
                onClick={() => selectFood(entry)}
                // Not ring-2 ring-avocado-yellow: .glass-chip's own
                // box-shadow replaces it outright, so the highlight never
                // painted and picking a food looked like nothing had
                // happened. See index.css's .glass-chip-selected.
                className={`glass-chip glass-static flex w-full items-center justify-between rounded-xl p-3 text-sm font-medium text-white ${
                  selected?.id === entry.id ? "glass-chip-selected" : ""
                }`}
              >
                {entry.nameFa}
              </button>
            ))}
        </div>

        {selected && unit && (
          <div className="glass-chip space-y-3 rounded-xl p-3">
            <p className="text-center text-sm font-semibold text-white">
              {selected.nameFa}
            </p>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-16 glass-chip rounded-lg px-2 py-2 text-center text-sm text-white"
              />

              <select
                value={unit.label}
                onChange={(e) => {
                  const next =
                    selected.servingUnits.find(
                      (u) => u.label === e.target.value,
                    ) ?? selected.servingUnits[0];
                  setUnit(next);
                }}
                className="glass-static w-full flex-1 glass-chip rounded-lg px-2 py-2 text-sm text-white"
              >
                {selected.servingUnits.map((u) => (
                  <option key={u.label} value={u.label}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-center text-sm text-white/70">
              {toFaDigits(caloriesForServing(selected, unit, quantity))} کالری
              {" · "}
              {toFaDigits(macrosForServing(selected, unit, quantity).protein)} گرم پروتئین
            </p>
          </div>
        )}

        <button
          onClick={handleAdd}
          disabled={!selected}
          className="w-full glass-action rounded-2xl py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
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
    </ModalOverlay>
  );
}
