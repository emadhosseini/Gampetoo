import { useEffect, useState } from "react";
import { PenLine } from "lucide-react";

import ModalOverlay from "@/components/ModalOverlay";
import type { MealSlot } from "@/data/nutrition/foodCatalog";
import { toEnDigits } from "@/domain/nutrition/mealTextParser";
import { addLoggedEntry } from "@/utils/dailyLogEngine";
import { toFaDigits } from "@/utils/numberFormat";

export interface ManualMacroEntryModalProps {
  meal: MealSlot | null;
  onClose: () => void;
  // Bumped after the add so the card behind the modal shows the fresh
  // totals once this closes — matches AddMealEntryModal's contract.
  onChange: () => void;
  // Which day to log against — see AddMealEntryModal's own `date` prop.
  date?: string;
}

type MacroField = "calories" | "protein" | "carbs" | "fat";

const FIELDS: { key: MacroField; label: string; unit: string }[] = [
  { key: "calories", label: "کالری", unit: "کیلوکالری" },
  { key: "protein", label: "پروتئین", unit: "گرم" },
  { key: "carbs", label: "کربوهیدرات", unit: "گرم" },
  { key: "fat", label: "چربی", unit: "گرم" },
];

// Logged as one "سهم" so the entry stays editable afterwards like the other
// two add flows: changing it to ۲ in EditMealEntryModal doubles every macro.
const UNIT_LABEL = "سهم";

const EMPTY: Record<MacroField, string> = { calories: "", protein: "", carbs: "", fat: "" };

// Text → number, accepting Persian/Arabic digits and decimal separators
// since the field is typed on a Persian keyboard. Blank reads as "not
// given" (undefined), anything unreadable or negative as NaN.
function parseMacro(value: string): number | undefined {
  const trimmed = toEnDigits(value.trim()).replace(/[٫,]/g, ".");
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
}

// The third way to add to a meal, next to the food search and the AI: for
// something whose numbers are already known (a packaged food's label, a
// restaurant's published macros) and that isn't in the catalog. A title
// plus whichever macros the user has; calories left blank are worked out
// from the macros (۴/۴/۹ per gram).
export default function ManualMacroEntryModal({
  meal,
  onClose,
  onChange,
  date,
}: ManualMacroEntryModalProps) {
  const [title, setTitle] = useState("");
  // Text, not numbers — same reasoning as EditMealEntryModal's amount field.
  const [values, setValues] = useState(EMPTY);

  useEffect(() => {
    // Reset every time a different meal's modal opens.
    setTitle("");
    setValues(EMPTY);
  }, [meal]);

  if (!meal) {
    return null;
  }

  const protein = parseMacro(values.protein);
  const carbs = parseMacro(values.carbs);
  const fat = parseMacro(values.fat);
  const enteredCalories = parseMacro(values.calories);

  const anyInvalid = [enteredCalories, protein, carbs, fat].some((v) => Number.isNaN(v));
  const anyMacro = protein !== undefined || carbs !== undefined || fat !== undefined;
  const derivedCalories = anyMacro
    ? Math.round((protein ?? 0) * 4 + (carbs ?? 0) * 4 + (fat ?? 0) * 9)
    : undefined;
  const calories = enteredCalories ?? derivedCalories;

  const valid = title.trim() !== "" && !anyInvalid && calories !== undefined;

  function handleAdd() {
    if (!valid) return;

    const macros = {
      calories: Math.round(calories!),
      protein: protein !== undefined ? Math.round(protein) : undefined,
      carbs: carbs !== undefined ? Math.round(carbs) : undefined,
      fat: fat !== undefined ? Math.round(fat) : undefined,
    };

    addLoggedEntry(
      meal!.id,
      {
        name: title.trim(),
        amount: `${toFaDigits(1)} ${UNIT_LABEL}`,
        quantity: 1,
        unitLabel: UNIT_LABEL,
        base: { quantity: 1, ...macros },
        ...macros,
      },
      date,
    );

    onChange();
    onClose();
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-panel glass-static max-h-[85vh] space-y-4 overflow-y-auto rounded-3xl p-6">
        <h2 className="flex items-center justify-center gap-2 text-center text-lg font-bold text-white">
          <PenLine size={20} className="text-avocado-yellow" />
          ورود دستی ماکروها به وعده {meal.title}
        </h2>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="عنوان، مثلاً: پروتئین بار"
          aria-label="عنوان"
          className="glass-chip glass-static w-full rounded-xl p-3 text-sm text-white placeholder:text-white/50 outline-none"
        />

        <div className="grid grid-cols-2 gap-2">
          {FIELDS.map((field) => (
            <label
              key={field.key}
              className="glass-chip glass-static flex flex-col gap-1 rounded-xl p-3"
            >
              <span className="text-xs text-white/70">
                {field.label} <span className="text-white/40">({field.unit})</span>
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={values[field.key]}
                onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                onFocus={(e) => e.target.select()}
                placeholder={
                  field.key === "calories" && derivedCalories !== undefined
                    ? toFaDigits(derivedCalories)
                    : "—"
                }
                className="w-full bg-transparent text-center text-base font-bold text-white placeholder:text-white/30 outline-none"
              />
            </label>
          ))}
        </div>

        {enteredCalories === undefined && derivedCalories !== undefined && (
          <p className="text-center text-xs text-white/60">
            کالری از روی ماکروها حساب می‌شه: {toFaDigits(derivedCalories)} کیلوکالری
          </p>
        )}

        {anyInvalid && (
          <p className="text-center text-xs text-avocado-yellow">
            مقدارها باید عدد مثبت باشن.
          </p>
        )}

        <button
          onClick={handleAdd}
          disabled={!valid}
          className="w-full glass-action rounded-2xl py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          افزودن به وعده
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
