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

// Stand-ins for a profile that hasn't recorded them yet, so the preview
// still produces a number instead of nothing. The user is told when one of
// these is in play — see `missing` below.
const FALLBACK_AGE = 25;
const FALLBACK_HEIGHT_CM = 170;

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

// Collects what Mifflin-St Jeor needs that isn't already known. Age and
// height aren't asked for: the profile owns them (age derived from the
// birth date there), and having a second place to type them meant the two
// could disagree, with this one silently winning. They're shown read-only
// below instead, so the calculation stays inspectable.
export default function CalorieGoalModal({ open, onClose, onSaved }: CalorieGoalModalProps) {
  const [gender, setGender] = useState<Gender>(() => getCurrentUserGender() ?? "male");
  const [weightKg, setWeightKg] = useState(() => Math.round(getLatestWeight() ?? 70));
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    () => getActivityLevel() ?? "light",
  );
  const [goal, setGoal] = useState<CalorieGoal>(() => getCalorieGoal() ?? "maintain");

  if (!open) {
    return null;
  }

  // Straight from the profile. The fallbacks only stand in so the preview
  // still shows a number when the profile is incomplete — the notice below
  // says which one is a guess rather than letting it pass as the user's.
  const profileAge = getCurrentUserAge();
  const profileHeight = getCurrentUserHeight();

  const age = profileAge ?? FALLBACK_AGE;
  const heightCm = profileHeight ?? FALLBACK_HEIGHT_CM;

  const missing = [
    profileAge === null ? "تاریخ تولد" : null,
    profileHeight === null ? "قد" : null,
  ].filter((label): label is string => label !== null);

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

        {/* Read-only, from the profile. Shown rather than hidden because
            they move the result as much as anything the user can change
            here, and a number you can't see is a number you can't tell is
            wrong. */}
        <div className="glass-chip flex items-center justify-between rounded-xl p-3">
          <div>
            <p className="text-xs text-white/60">سن</p>
            <p className="mt-0.5 font-bold text-white">
              {toFaDigits(age)}{" "}
              <span className="text-sm font-normal text-white/60">سال</span>
            </p>
          </div>

          <div className="text-left">
            <p className="text-xs text-white/60">قد</p>
            <p className="mt-0.5 font-bold text-white">
              {toFaDigits(heightCm)}{" "}
              <span className="text-sm font-normal text-white/60">
                سانتی‌متر
              </span>
            </p>
          </div>
        </div>

        {missing.length > 0 && (
          <p className="text-xs leading-relaxed text-white/60">
            {missing.join(" و ")} توی حساب کاربری ثبت نشده، پس فعلاً یک عدد
            پیش‌فرض برای محاسبه استفاده شده. برای نتیجه‌ی دقیق‌تر از صفحه‌ی
            حساب کاربری ثبتش کن.
          </p>
        )}

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
