import { useNavigate } from "react-router-dom";

import MealCard from "../components/nutrition/MealCard";
import FreeMealCard from "../components/nutrition/FreeMealCard";
import SubstitutionsCard from "../components/nutrition/SubstitutionsCard";
import WorkoutHeader from "../components/WorkoutHeader";
import { mealPlans } from "../data/nutrition/mealPlans";

import {
  getActiveProgram,
  getCurrentMealPlan,
  hasProgramStarted,
} from "../utils/programEngine";

export default function NutritionPage() {
  const navigate = useNavigate();

  const started = hasProgramStarted();

  const plan = started
    ? getCurrentMealPlan()
    : getActiveProgram().nutrition.rest;

  const title = started
    ? plan.title
    : "تغذیه در روز بدون برنامه ورزشی";

  const enabledMeals = plan.meals.filter(
    (meal) => (meal.enabled ?? true) && meal.foods.length > 0,
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

      {enabledMeals.map((meal) => (
        <MealCard key={meal.id} meal={meal} />
      ))}

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
