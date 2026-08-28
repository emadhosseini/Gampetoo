import { FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import MealCard from "../components/nutrition/MealCard";
import FreeMealCard from "../components/nutrition/FreeMealCard";
import LogPlanFoodModal from "../components/nutrition/LogPlanFoodModal";
import PlanTextImportModal from "../components/nutrition/PlanTextImportModal";
import SubstitutionsCard from "../components/nutrition/SubstitutionsCard";
import WorkoutHeader from "../components/WorkoutHeader";
import { mealPlans } from "../data/nutrition/mealPlans";
import type { FoodItem, MealSection } from "../types/nutrition";

import { getMealDisplaySettings } from "../utils/appSettingsEngine";
import {
  getActiveProgram,
  getCurrentMealPlan,
  hasProgramStarted,
} from "../utils/programEngine";

export default function NutritionPage() {
  const navigate = useNavigate();

  // Which planned food is being logged as eaten, and a brief confirmation
  // once it has been — tapping a food here writes straight to the daily
  // log, which lives on a different screen entirely, so without this the
  // tap would look like it did nothing at all.
  const [picked, setPicked] = useState<{
    meal: MealSection;
    food: FoodItem;
  } | null>(null);
  const [justLogged, setJustLogged] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  // The plan is read during render straight from storage, so a re-render is
  // all it takes to show what an import just wrote.
  const [, forceRerender] = useState(0);

  useEffect(() => {
    if (!justLogged) return;

    const timer = setTimeout(() => setJustLogged(null), 2500);

    return () => clearTimeout(timer);
  }, [justLogged]);

  const started = hasProgramStarted();

  const plan = started
    ? getCurrentMealPlan()
    : getActiveProgram().nutrition.rest;

  const title = started
    ? plan.title
    : "تغذیه در روز بدون برنامه ورزشی";

  // Hidden meals drop out here too, so a slot turned off in the daily log's
  // display settings doesn't come back on the plan view — it's one answer
  // to "which meals are part of my day", not a per-screen one. The plan's
  // own settings screen still lists every slot, since that's where the
  // hidden one's contents would be edited.
  const { hiddenMealIds } = getMealDisplaySettings();

  const enabledMeals = plan.meals.filter(
    (meal) =>
      (meal.enabled ?? true) &&
      meal.foods.length > 0 &&
      !hiddenMealIds.includes(meal.id),
  );

  const hasSelections = enabledMeals.length > 0;

  if (!hasSelections) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <WorkoutHeader
          title={title}
          // Same pencil affordance WorkoutHeader already offers on the
          // workout page — goes straight to this exact plan's own
          // settings screen (plan.type already reflects whether today is
          // a workout or rest day) instead of the generic nutrition-
          // settings landing page.
          onEditWorkout={() => navigate(`/settings/nutrition/${plan.type}`)}
          onEditWorkoutLabel="تغییر برنامه غذایی"
        />

        {/* Same modal the plan-settings screen offers, reachable from the
            day itself — writing today's eating out as text is a daily act,
            and the settings screen is two taps away. */}
        <button
          onClick={() => setImportOpen(true)}
          className="glass-tap flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-semibold text-white"
        >
          <FileText size={18} />
          نوشتن برنامه با متن
        </button>

        <PlanTextImportModal
          open={importOpen}
          planType={plan.type}
          onClose={() => setImportOpen(false)}
          onApplied={() => forceRerender((n) => n + 1)}
        />

        <div className="glass-panel rounded-2xl p-6 text-center">
          <p className="text-white">
            شما برنامه غذایی انتخاب نکردین
          </p>

          <button
            onClick={() => navigate("/settings/nutrition")}
            className="mt-4 rounded-xl glass-action px-5 py-3 text-sm font-semibold text-white"
          >
            رفتن به تنظیمات برنامه غذایی
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <WorkoutHeader
        title={title}
        onEditWorkout={() => navigate(`/settings/nutrition/${plan.type}`)}
        onEditWorkoutLabel="تغییر برنامه غذایی"
      />

      {/* Same modal the plan-settings screen offers, reachable from the
        day itself — writing today's eating out as text is a daily act,
        and the settings screen is two taps away. */}
      <button
        onClick={() => setImportOpen(true)}
        className="glass-tap flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-semibold text-white"
      >
        <FileText size={18} />
        نوشتن برنامه با متن
      </button>

      <PlanTextImportModal
        open={importOpen}
        planType={plan.type}
        onClose={() => setImportOpen(false)}
        onApplied={() => forceRerender((n) => n + 1)}
      />

      {justLogged && (
        <p className="rounded-xl bg-green-500/15 py-2 text-center text-sm font-semibold text-green-400">
          «{justLogged}» به غذاهای خورده‌شده اضافه شد ✅
        </p>
      )}

      {enabledMeals.map((meal) => (
        <MealCard
          key={meal.id}
          meal={meal}
          onSelectFood={(meal, food) => setPicked({ meal, food })}
        />
      ))}

      <LogPlanFoodModal
        meal={picked?.meal ?? null}
        food={picked?.food ?? null}
        onClose={() => setPicked(null)}
        onLogged={setJustLogged}
      />

      {/* Read from the static source, not plan.substitutions — that field
          is only ever a snapshot copied into the user's own program at
          creation time (see createEmptyMealPlan), so an app update to the
          substitution lists never reached an account created before it.
          Substitutions aren't user-editable content like meals/workouts
          are, so there's nothing to lose by always reading the current
          list live instead of a frozen per-user copy. */}
      <SubstitutionsCard substitutions={mealPlans[plan.type].substitutions} />

      <FreeMealCard />
    </div>
  );
}
