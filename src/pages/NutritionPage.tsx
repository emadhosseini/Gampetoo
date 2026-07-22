import { useNavigate } from "react-router-dom";

import MealCard from "../components/nutrition/MealCard";
import FreeMealCard from "../components/nutrition/FreeMealCard";
import SubstitutionsCard from "../components/nutrition/SubstitutionsCard";
import WorkoutHeader from "../components/WorkoutHeader";

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
        <WorkoutHeader subtitle="🍽 تغذیه امروز" title={title} />

        <div className="glass-panel rounded-2xl p-6 text-center">
          <p className="text-white">
            شما برنامه غذایی انتخاب نکردین
          </p>

          <button
            onClick={() => navigate("/settings/nutrition")}
            className="mt-4 rounded-xl bg-avocado-yellow px-5 py-3 text-sm font-semibold text-black"
          >
            رفتن به تنظیمات برنامه غذایی
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <WorkoutHeader subtitle="🍽 تغذیه امروز" title={title} />

      {enabledMeals.map((meal) => (
        <MealCard key={meal.id} meal={meal} />
      ))}

      <SubstitutionsCard substitutions={plan.substitutions} />

      <FreeMealCard message={plan.freeMeal} />
    </div>
  );
}
