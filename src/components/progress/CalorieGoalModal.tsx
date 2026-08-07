import { useState } from "react";

import ModalOverlay from "@/components/ModalOverlay";
import {
  ACTIVITY_LEVEL_HINTS,
  ACTIVITY_LEVEL_LABELS,
  CALORIE_GOAL_LABELS,
  WEEKLY_LOSS_RATES,
  calculateCalorieTarget,
  calculateProteinTarget,
  getActivityLevel,
  getCalorieGoal,
  getWeeklyLossGrams,
  saveCalorieProfile,
  type ActivityLevel,
  type CalorieGoal,
} from "@/utils/calorieEngine";
import {
  getCurrentUserAge,
  getCurrentUserGender,
  getCurrentUserHeight,
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
const FALLBACK_WEIGHT_KG = 70;

export interface CalorieGoalModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
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

// Collects what Mifflin-St Jeor needs that isn't already known. Age,
// height and gender aren't asked for: the profile owns them (age derived
// from the birth date there), and having a second place to state them
// meant the two could disagree, with this one silently winning. Age and
// height are shown read-only below so the calculation stays inspectable;
// gender doesn't get a display row at all — nothing on this screen needs
// to show it, it's just read straight into the formula.
export default function CalorieGoalModal({ open, onClose, onSaved }: CalorieGoalModalProps) {
  const [weeklyLossGrams, setWeeklyLossGrams] = useState<number>(
    () => getWeeklyLossGrams(),
  );
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
  // Gender has no fallback to report as missing: calculateBmr just needs
  // some value, and "male" is as arbitrary a default as any — the profile
  // page is where this actually gets corrected.
  const gender = getCurrentUserGender() ?? "male";
  const profileAge = getCurrentUserAge();
  const profileHeight = getCurrentUserHeight();
  const profileWeight = getLatestWeight();

  const age = profileAge ?? FALLBACK_AGE;
  const heightCm = profileHeight ?? FALLBACK_HEIGHT_CM;
  const weightKg = Math.round(profileWeight ?? FALLBACK_WEIGHT_KG);

  const missing = [
    profileAge === null ? "تاریخ تولد" : null,
    profileHeight === null ? "قد" : null,
    profileWeight === null ? "وزن" : null,
  ].filter((label): label is string => label !== null);

  const preview = calculateCalorieTarget({
    gender,
    age,
    heightCm,
    weightKg,
    activityLevel,
    goal,
    weeklyLossGrams,
  });

  const protein = calculateProteinTarget(weightKg, goal);

  function handleSave() {
    saveCalorieProfile({
      gender,
      age,
      heightCm,
      weightKg,
      activityLevel,
      goal,
      weeklyLossGrams,
    });
    onSaved();
    onClose();
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="glass-panel glass-static max-h-[85vh] space-y-4 overflow-y-auto rounded-3xl p-6">
        <h2 className="text-center text-lg font-bold text-white">محاسبه کالری هدف</h2>

        {/* Read-only, from the profile. Shown rather than hidden because
            they move the result as much as anything the user can change
            here, and a number you can't see is a number you can't tell is
            wrong. */}
        <div className="glass-chip grid grid-cols-3 gap-2 rounded-xl p-3 text-center">
          <div>
            <p className="text-xs text-white/60">سن</p>
            <p className="mt-0.5 font-bold text-white">
              {toFaDigits(age)}{" "}
              <span className="text-xs font-normal text-white/60">سال</span>
            </p>
          </div>

          <div>
            <p className="text-xs text-white/60">قد</p>
            <p className="mt-0.5 font-bold text-white">
              {toFaDigits(heightCm)}{" "}
              <span className="text-xs font-normal text-white/60">سانتی‌متر</span>
            </p>
          </div>

          <div>
            <p className="text-xs text-white/60">وزن</p>
            <p className="mt-0.5 font-bold text-white">
              {toFaDigits(weightKg)}{" "}
              <span className="text-xs font-normal text-white/60">کیلوگرم</span>
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

          {/* Only while cutting: a rate is what a deficit *is*, and the other
              two goals have nothing to apply it to. Each button is a real
              difference in the target below — 250g a week and 1kg a week are
              about 800 calories apart. */}
          {goal === "lose" && (
            <div className="mt-3">
              <p className="mb-2 text-sm text-white/60">کاهش وزن در هفته</p>

              <div className="grid grid-cols-4 gap-2">
                {WEEKLY_LOSS_RATES.map((grams) => (
                  <ChoiceButton
                    key={grams}
                    active={weeklyLossGrams === grams}
                    onClick={() => setWeeklyLossGrams(grams)}
                    title={
                      grams === 1000
                        ? "۱ کیلو"
                        : `${toFaDigits(grams)} گرم`
                    }
                  />
                ))}
              </div>
            </div>
          )}
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

        {/* Half the calorie box's height, because it's the supporting number
            rather than the answer — but it belongs on this screen: the
            protein a target implies changes with the goal, and eating to a
            deficit without it is how the weight lost turns out to be
            muscle. */}
        <div className="glass-chip flex items-center justify-center gap-2 rounded-2xl p-3 text-center">
          <span className="text-xs text-white/60">پروتئین مورد نیاز روزانه</span>
          <span className="text-lg font-bold text-white">
            {toFaDigits(protein.grams)}
          </span>
          <span className="text-xs text-white/60">گرم</span>
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
