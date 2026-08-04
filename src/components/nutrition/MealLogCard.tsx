import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import type { MealSlot } from "@/data/nutrition/foodCatalog";
import { getLoggedEntries } from "@/utils/dailyLogEngine";
import { toFaDigits } from "@/utils/numberFormat";

export interface MealLogCardProps {
  meal: MealSlot;
  // Tapping the "+" skips straight to the add-food screen; tapping anywhere
  // else on the card opens the overview of what's already logged.
  onOpen: (meal: MealSlot) => void;
  onAdd: (meal: MealSlot) => void;
}

const MACRO_FIELDS = [
  { key: "protein", label: "پروتئین" },
  { key: "carbs", label: "کربوهیدرات" },
  { key: "fat", label: "چربی" },
  { key: "fiber", label: "فیبر" },
] as const;

export default function MealLogCard({
  meal,
  onOpen,
  onAdd,
}: MealLogCardProps) {
  const [expanded, setExpanded] = useState(false);
  const entries = getLoggedEntries(meal.id);

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

  return (
    // One box the whole way through — the expanding "ارزش‌های غذایی" panel
    // below is just more of this same element's own height (framer-motion
    // animates height, nothing else), never a second, separately-positioned
    // box. That's deliberate: it's the only way the top edge is
    // *guaranteed* to sit in the exact same place whether the panel is
    // open or closed, since nothing above it ever moves — growth only
    // ever pushes the bottom edge down.
    <div className="glass-panel glass-static overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between gap-3 p-5">
        <button
          onClick={() => onOpen(meal)}
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
            <div className="grid grid-cols-4 gap-2 px-5 pb-4">
              {MACRO_FIELDS.map((field) => (
                <div
                  key={field.key}
                  className="glass-chip rounded-xl py-3 text-center"
                >
                  <p className="text-xs text-white/60">{field.label}</p>
                  <p className="mt-1 text-sm font-bold text-white">
                    {toFaDigits(macroTotals[field.key])}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setExpanded((prev) => !prev)}
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
