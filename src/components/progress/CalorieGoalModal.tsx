import { useState } from "react";
import { Minus, Plus } from "lucide-react";

import ModalOverlay from "@/components/ModalOverlay";
import {
  ACTIVITY_LEVEL_HINTS,
  ACTIVITY_LEVEL_LABELS,
  CALORIE_GOAL_LABELS,
  calculateCalorieTarget,
  getActivityLevel,
  getCalorieGoal,
  saveCalorieProfile,
  type ActivityLevel,
  type CalorieGoal,
} from "@/utils/calorieEngine";
import {
  getCurrentUserAge,
  getCurrentUserGender,
  getCurrentUserHeight,
  type Gender,
} from "@/utils/userEngine";
import { getLatestWeight } from "@/utils/weightEngine";
import { toFaDigits } from "@/utils/numberFormat";

const ACTIVITY_LEVELS: ActivityLevel[] = ["sedentary", "light", "moderate", "active"];
const GOALS: CalorieGoal[] = ["lose", "maintain", "gain"];

export interface CalorieGoalModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

// A compact +/- row, used for the three numeric inputs. Deliberately not
// the app's wheel picker: with six fields in one popup, three wheels would
// make it far taller than the screen.
function StepperRow({
  label,
  value,
  unit,
  step,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  step: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm text-white/60">{label}</p>

      <div className="selector-pill flex items-center justify-between rounded-xl p-3">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          disabled={value <= min}
          aria-label={`کم کردن ${label}`}
          className="text-white disabled:opacity-30"
        >
          <Minus size={20} />
        </button>

        <span className="text-lg font-bold text-white">
          {toFaDigits(value)}{" "}
          <span className="text-sm font-normal text-white/60">{unit}</span>
        </span>

        <button
          onClick={() => onChange(Math.min(max, value + step))}
          disabled={value >= max}
          aria-label={`زیاد کردن ${label}`}
          className="text-white disabled:opacity-30"
        >
          <Plus size={20} />
        </button>
      </div>
    </div>
  );
}

function ChoiceButton({
  active,
  onClick,
  title,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  hint?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-xl px-2 py-3 text-center transition-colors ${
        active ? "glass-selected" : "glass-chip"
      }`}
    >
      <span className="block text-sm font-bold text-white">{title}</span>
      {hint && <span className="mt-0.5 block text-[10px] text-white/50">{hint}</span>}
    </button>
  );
}

// Collects everything Mifflin-St Jeor needs, pre-filled from whatever the
// profile already knows so most people only have to pick an activity level
// and a goal. Shows the resulting number live, so the choices visibly move
// it rather than being a black box you only see the result of after saving.
export default function CalorieGoalModal({ open, onClose, onSaved }: CalorieGoalModalProps) {
  const [gender, setGender] = useState<Gender>(() => getCurrentUserGender() ?? "male");
  const [age, setAge] = useState(() => getCurrentUserAge() ?? 25);
  const [heightCm, setHeightCm] = useState(() => getCurrentUserHeight() ?? 170);
  const [weightKg, setWeightKg] = useState(() => Math.round(getLatestWeight() ?? 70));
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    () => getActivityLevel() ?? "light",
  );
  const [goal, setGoal] = useState<CalorieGoal>(() => getCalorieGoal() ?? "maintain");

  if (!open) {
    return null;
  }

  const preview = calculateCalorieTarget({
    gender,
    age,
    heightCm,
    weightKg,
    activityLevel,
    goal,
  });

  function handleSave() {
    saveCalorieProfile({ gender, age, heightCm, weightKg, activityLevel, goal });
    onSaved();
    onClose();
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-panel glass-static max-h-[85vh] space-y-4 overflow-y-auto rounded-3xl p-6">
        <h2 className="text-center text-lg font-bold text-white">محاسبه هدف کالری</h2>

        <div>
          <p className="mb-2 text-sm text-white/60">جنسیت</p>

          <div className="flex gap-3">
            <ChoiceButton
              active={gender === "male"}
              onClick={() => setGender("male")}
              title="مرد"
            />
            <ChoiceButton
              active={gender === "female"}
              onClick={() => setGender("female")}
              title="زن"
            />
          </div>
        </div>

        <StepperRow
          label="سن"
          value={age}
          unit="سال"
          step={1}
          min={10}
          max={100}
          onChange={setAge}
        />

        <StepperRow
          label="قد"
          value={heightCm}
          unit="سانتی‌متر"
          step={1}
          min={100}
          max={230}
          onChange={setHeightCm}
        />

        <StepperRow
          label="وزن"
          value={weightKg}
          unit="کیلوگرم"
          step={1}
          min={30}
          max={250}
          onChange={setWeightKg}
        />

        <div>
          <p className="mb-2 text-sm text-white/60">سطح فعالیت</p>

          <div className="grid grid-cols-2 gap-2">
            {ACTIVITY_LEVELS.map((level) => (
              <ChoiceButton
                key={level}
                active={activityLevel === level}
                onClick={() => setActivityLevel(level)}
                title={ACTIVITY_LEVEL_LABELS[level]}
                hint={ACTIVITY_LEVEL_HINTS[level]}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm text-white/60">هدف</p>

          <div className="flex gap-2">
            {GOALS.map((g) => (
              <ChoiceButton
                key={g}
                active={goal === g}
                onClick={() => setGoal(g)}
                title={CALORIE_GOAL_LABELS[g]}
              />
            ))}
          </div>
        </div>

        <div className="glass-chip rounded-2xl p-4 text-center">
          <p className="text-xs text-white/60">هدف کالری روزانه‌ی تو</p>

          <p className="mt-1 text-3xl font-bold text-white">
            {toFaDigits(preview.target)}
          </p>

          <p className="mt-2 text-xs text-white/50">
            سوخت‌وساز پایه {toFaDigits(preview.bmr)} · نیاز روزانه{" "}
            {toFaDigits(preview.tdee)}
          </p>
        </div>

        <button
          onClick={handleSave}
          className="w-full glass-action rounded-2xl py-3 font-bold text-white"
        >
          ذخیره هدف
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
