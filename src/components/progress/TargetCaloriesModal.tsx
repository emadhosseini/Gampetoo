import { useState } from "react";
import { Minus, Plus } from "lucide-react";

import ModalOverlay from "@/components/ModalOverlay";
import {
  CALORIE_GOAL_LABELS,
  calculateProteinTarget,
  getCalorieGoal,
  setCalorieGoal,
  type CalorieGoal,
} from "@/utils/calorieEngine";
import {
  clearMacroTargets,
  getCalorieTarget,
  getCalorieTargetMode,
  getDualCalorieTargets,
  getDualMacroTargets,
  getSingleMacroTargets,
  setCalorieTarget,
  setCalorieTargetMode,
  setDualCalorieTargets,
  setDualMacroTargets,
  setSingleMacroTargets,
  type CalorieTargetMode,
  type MacroTargetInputs,
  type MacroTargetValues,
} from "@/utils/dailyLogEngine";
import { getLatestWeight } from "@/utils/weightEngine";
import { toFaDigits } from "@/utils/numberFormat";

const STEP = 50;
const MACRO_STEP = 5;
const DEFAULT_CALORIES = 2000;
const DEFAULT_MACROS: MacroTargetInputs = { protein: 150, carbs: 200, fat: 60, fiber: 25 };

const GOALS: CalorieGoal[] = ["lose", "maintain", "gain"];

const MODES: { value: CalorieTargetMode; label: string }[] = [
  { value: "single", label: "یک کالری هدف" },
  { value: "dual", label: "تمرین/استراحت جدا" },
];

const MACRO_FIELDS: { key: keyof MacroTargetInputs; label: string }[] = [
  { key: "protein", label: "پروتئین" },
  { key: "carbs", label: "کربوهیدرات" },
  { key: "fat", label: "چربی" },
  { key: "fiber", label: "فیبر" },
];

function withDefaults(saved: MacroTargetValues): MacroTargetInputs {
  return {
    protein: saved.protein ?? DEFAULT_MACROS.protein,
    carbs: saved.carbs ?? DEFAULT_MACROS.carbs,
    fat: saved.fat ?? DEFAULT_MACROS.fat,
    fiber: saved.fiber ?? DEFAULT_MACROS.fiber,
  };
}

function Stepper({
  label,
  value,
  onChange,
  step = STEP,
  unit,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  step?: number;
  unit?: string;
}) {
  return (
    <div>
      <p className="mb-1 text-right text-sm text-white/60">{label}</p>
      <div className="selector-pill flex items-center justify-between rounded-xl p-3">
        <button onClick={() => onChange(Math.max(0, value - step))} aria-label="کم کردن">
          <Minus size={20} />
        </button>

        <span className="text-2xl font-bold text-white">
          {toFaDigits(value)}
          {unit ? <span className="mr-1 text-sm font-normal text-white/60">{unit}</span> : null}
        </span>

        <button onClick={() => onChange(value + step)} aria-label="زیاد کردن">
          <Plus size={20} />
        </button>
      </div>
    </div>
  );
}

// The four macro steppers for one target set (single, or one side of a
// dual training/rest pair) — grouped so dual mode can render this same
// block twice instead of duplicating four steppers by hand.
function MacroFields({
  title,
  values,
  onChange,
}: {
  title?: string;
  values: MacroTargetInputs;
  onChange: (next: MacroTargetInputs) => void;
}) {
  return (
    <div className="space-y-3">
      {title ? <p className="text-right text-sm text-white/60">{title}</p> : null}

      {MACRO_FIELDS.map((field) => (
        <Stepper
          key={field.key}
          label={field.label}
          value={values[field.key]}
          onChange={(next) => onChange({ ...values, [field.key]: next })}
          step={MACRO_STEP}
          unit="گرم"
        />
      ))}
    </div>
  );
}

// Stating the calorie target by hand, with no calculation behind it — in
// either "single" mode (one number, every day) or "dual" mode (a training-
// day number and a rest-day number). Dual is manual-only by design: it
// exists for people who already know both numbers, so unlike single mode it
// has no calculator branch to plug into. Protein/carbs/fat/fiber follow the
// same split when the macros toggle is on: one set in single mode, a
// separate set per day-type in dual mode.
//
// The goal picker still matters even with a manual protein figure: it's
// what the reference calculation below (and the auto-calculate flow
// elsewhere) uses, so it stays in sync with whichever number the user
// hasn't overridden yet.
export default function TargetCaloriesModal({
  open,
  onClose,
  onSaved,
}: TargetCaloriesModalProps) {
  const [mode, setMode] = useState<CalorieTargetMode>(() => getCalorieTargetMode());
  const [calories, setCalories] = useState(() => getCalorieTarget() ?? DEFAULT_CALORIES);
  const [training, setTraining] = useState(
    () => getDualCalorieTargets().training ?? DEFAULT_CALORIES,
  );
  const [rest, setRest] = useState(() => getDualCalorieTargets().rest ?? DEFAULT_CALORIES);
  const [goal, setGoal] = useState<CalorieGoal>(() => getCalorieGoal() ?? "maintain");

  const savedSingleMacros = getSingleMacroTargets();
  const savedDualMacros = getDualMacroTargets();
  const [macrosEnabled, setMacrosEnabled] = useState(
    () =>
      Object.values(savedSingleMacros).some((v) => v !== null) ||
      Object.values(savedDualMacros.training).some((v) => v !== null) ||
      Object.values(savedDualMacros.rest).some((v) => v !== null),
  );
  const [singleMacros, setSingleMacros] = useState<MacroTargetInputs>(() =>
    withDefaults(savedSingleMacros),
  );
  const [trainingMacros, setTrainingMacros] = useState<MacroTargetInputs>(() =>
    withDefaults(savedDualMacros.training),
  );
  const [restMacros, setRestMacros] = useState<MacroTargetInputs>(() =>
    withDefaults(savedDualMacros.rest),
  );

  if (!open) {
    return null;
  }

  // Without a weigh-in there is no calculated protein figure to show as a
  // reference — said plainly below rather than shown against a guessed
  // weight. Purely informational: it doesn't write anywhere on its own,
  // it's just what the protein field above would default to.
  const weight = getLatestWeight();
  const calculatedProtein = weight !== null ? calculateProteinTarget(weight, goal) : null;

  function handleSave() {
    setCalorieTargetMode(mode);

    if (mode === "dual") {
      setDualCalorieTargets({ training, rest });
    } else {
      setCalorieTarget(calories);
    }

    if (macrosEnabled) {
      if (mode === "dual") {
        setDualMacroTargets(trainingMacros, restMacros);
      } else {
        setSingleMacroTargets(singleMacros);
      }
    } else {
      clearMacroTargets();
    }

    setCalorieGoal(goal);
    onSaved();
    onClose();
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-panel glass-static max-h-[85vh] space-y-4 overflow-y-auto rounded-3xl p-6 text-center">
        <h2 className="text-lg font-bold text-white">کالری هدف روزانه</h2>

        <div className="flex gap-2">
          {MODES.map((option) => (
            <button
              key={option.value}
              onClick={() => setMode(option.value)}
              className={`flex-1 rounded-xl px-2 py-3 text-sm font-bold text-white transition-colors ${
                mode === option.value ? "glass-selected" : "glass-chip"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {mode === "dual" ? (
          <>
            <Stepper label="روزهای تمرین" value={training} onChange={setTraining} />
            <Stepper label="روزهای استراحت" value={rest} onChange={setRest} />
          </>
        ) : (
          <Stepper label="کالری هدف" value={calories} onChange={setCalories} />
        )}

        <div>
          <p className="mb-2 text-right text-sm text-white/60">هدفت چیه؟</p>

          <div className="flex gap-2">
            {GOALS.map((option) => (
              <button
                key={option}
                onClick={() => setGoal(option)}
                className={`flex-1 rounded-xl px-2 py-3 text-sm font-bold text-white transition-colors ${
                  goal === option ? "glass-selected" : "glass-chip"
                }`}
              >
                {CALORIE_GOAL_LABELS[option]}
              </button>
            ))}
          </div>
        </div>

        <p className="glass-chip rounded-xl p-3 text-sm text-white/70">
          {calculatedProtein
            ? `پیشنهاد بر اساس وزن: ${toFaDigits(calculatedProtein.grams)} گرم پروتئین در روز`
            : "برای پیشنهاد پروتئین بر اساس وزن، اول وزنت رو ثبت کن"}
        </p>

        <button
          onClick={() => setMacrosEnabled((v) => !v)}
          className={`glass-tap selector-pill flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-bold text-white ${
            macrosEnabled ? "glass-selected" : ""
          }`}
        >
          <span>هدف پروتئین، کربوهیدرات، چربی و فیبر</span>
          <span className="text-xs font-normal text-white/60">
            {macrosEnabled ? "روشن" : "خاموش"}
          </span>
        </button>

        {macrosEnabled ? (
          mode === "dual" ? (
            <>
              <MacroFields
                title="ماکروهای روزهای تمرین"
                values={trainingMacros}
                onChange={setTrainingMacros}
              />
              <MacroFields
                title="ماکروهای روزهای استراحت"
                values={restMacros}
                onChange={setRestMacros}
              />
            </>
          ) : (
            <MacroFields values={singleMacros} onChange={setSingleMacros} />
          )
        ) : null}

        <button
          onClick={handleSave}
          className="w-full glass-action rounded-2xl py-3 font-bold text-white"
        >
          ذخیره
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

export interface TargetCaloriesModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}
