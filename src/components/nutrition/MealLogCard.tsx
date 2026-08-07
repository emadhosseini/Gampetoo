import { useMemo, useState } from "react";
import { ChevronDown, Pencil, Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import type { MealSlot } from "@/data/nutrition/foodCatalog";
import {
  calculateProteinTarget,
  getCalorieGoal,
  proteinStanding,
  type ProteinStanding,
} from "@/utils/calorieEngine";
import { getLoggedEntries, type LoggedFoodEntry } from "@/utils/dailyLogEngine";
import { getLatestWeight } from "@/utils/weightEngine";
import { toFaDigits } from "@/utils/numberFormat";

export interface MealLogCardProps {
  meal: MealSlot;
  // Tapping the "+" opens the choice of how to add (manual or AI); tapping
  // anywhere else on the card expands the panel below it instead of opening
  // anything.
  onAdd: (meal: MealSlot) => void;
  onEditEntry: (meal: MealSlot, entry: LoggedFoodEntry) => void;
  // Bumped by the page after every add/edit/remove. The card reads straight
  // from localStorage with nothing reactive in between, so this is what
  // tells it to look again — and it's a prop rather than a remount key
  // precisely so an edit doesn't collapse the panel the user is editing
  // from.
  version: number;
  // Whether this card's protein is the whole day's, and so can be judged
  // against the daily target. True only in daily tracking mode — see
  // DailyLogPage. In per-meal mode DailyTotalsCard carries it instead.
  showProteinTarget?: boolean;
}

// Matches DailyTotalsCard: red is short, green is there, amber is past the
// point of it doing anything more.
const PROTEIN_RING: Record<ProteinStanding, string> = {
  under: "ring-2 ring-red-400/70",
  onTarget: "ring-2 ring-green-400/70",
  over: "ring-2 ring-amber-300/70",
};

const MACRO_FIELDS = [
  { key: "protein", label: "پروتئین" },
  { key: "carbs", label: "کربوهیدرات" },
  { key: "fat", label: "چربی" },
  { key: "fiber", label: "فیبر" },
] as const;

export default function MealLogCard({
  meal,
  onAdd,
  onEditEntry,
  version,
  showProteinTarget = false,
}: MealLogCardProps) {
  const [expanded, setExpanded] = useState(false);
  const entries = useMemo(
    () => getLoggedEntries(meal.id),
    // `version` looks unused to the linter and is the entire point: this
    // reads localStorage directly, so nothing about the arguments changes
    // when the stored data does. Dropping it would cache the first read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [meal.id, version],
  );

  const totalCalories = entries.reduce(
    (sum, entry) => sum + (entry.calories ?? 0),
    0,
  );

  const macroTotals = {
    protein: entries.reduce((sum, entry) => sum + (entry.protein ?? 0), 0),
    carbs: entries.reduce((sum, entry) => sum + (entry.carbs ?? 0), 0),
    fat: entries.reduce((sum, entry) => sum + (entry.fat ?? 0), 0),
    fiber: entries.reduce((sum, entry) => sum + (entry.fiber ?? 0), 0),
  };

  const weight = getLatestWeight();
  const proteinTarget =
    showProteinTarget && weight !== null
      ? calculateProteinTarget(weight, getCalorieGoal() ?? "maintain")
      : null;

  const standing = proteinTarget
    ? proteinStanding(macroTotals.protein, proteinTarget)
    : null;

  function toggle() {
    setExpanded((prev) => !prev);
  }

  return (
    // One box the whole way through — the expanding panel below is just more
    // of this same element's own height (framer-motion animates height,
    // nothing else), never a second, separately-positioned box. That's
    // deliberate: it's the only way the top edge is *guaranteed* to sit in
    // the exact same place whether the panel is open or closed, since
    // nothing above it ever moves — growth only ever pushes the bottom edge
    // down.
    <div className="glass-panel glass-static overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between gap-3 p-5">
        <button
          onClick={toggle}
          aria-expanded={expanded}
          className="flex flex-1 items-center gap-3 text-right"
        >
          <span className="text-2xl">{meal.icon}</span>

          <div>
            <h2 className="text-lg font-semibold text-white">{meal.title}</h2>

            <p className="text-sm text-white/70">
              {entries.length > 0
                ? `${toFaDigits(totalCalories)} کالری ثبت‌شده`
                : "چیزی ثبت نشده"}
            </p>
          </div>
        </button>

        <button
          onClick={() => onAdd(meal)}
          aria-label={`افزودن ${meal.title}`}
          className="glass-action flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
        >
          <Plus size={20} />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-4 gap-2 px-5">
              {MACRO_FIELDS.map((field) => (
                <div
                  key={field.key}
                  className={`glass-chip rounded-xl py-3 text-center ${
                    field.key === "protein" && standing
                      ? PROTEIN_RING[standing]
                      : ""
                  }`}
                >
                  <p className="text-xs text-white/60">{field.label}</p>
                  <p className="mt-1 text-sm font-bold text-white">
                    {toFaDigits(macroTotals[field.key])}
                  </p>
                </div>
              ))}
            </div>

            {/* What those totals are made of. Each row opens the amount
                editor for that one food — the macro chips above are read-only
                sums, so this list is the only place a mistake in them can
                actually be corrected. */}
            {entries.length > 0 && (
              <div className="mt-3 max-h-64 space-y-2 overflow-y-auto px-5">
                {entries.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => onEditEntry(meal, entry)}
                    aria-label={`ویرایش ${entry.name}`}
                    className="glass-chip flex w-full items-center gap-2 rounded-xl p-3 text-right"
                  >
                    <Pencil size={14} className="shrink-0 text-white/50" />

                    <span className="flex-1 text-sm font-medium text-white">
                      {entry.name}
                      {entry.amount && (
                        <span className="mr-2 text-white/60">
                          {entry.amount}
                        </span>
                      )}
                    </span>

                    {entry.calories !== undefined && (
                      <span className="shrink-0 text-xs text-white/70">
                        {toFaDigits(entry.calories)} کالری
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className="h-4" />
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={toggle}
        aria-label={expanded ? "بستن ارزش‌های غذایی" : "نمایش ارزش‌های غذایی"}
        aria-expanded={expanded}
        className="glass-tap flex w-full items-center justify-center py-1.5 text-white/60"
      >
        <ChevronDown
          size={16}
          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>
    </div>
  );
}
