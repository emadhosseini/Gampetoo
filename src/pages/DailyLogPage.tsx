import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, UtensilsCrossed } from "lucide-react";

import PillTabBar, { type PillTabBarItem } from "@/components/PillTabBar";
import MealLogCard from "@/components/nutrition/MealLogCard";
import MealNutritionModal from "@/components/nutrition/MealNutritionModal";
import { getCurrentMealPlan, hasProgramStarted } from "@/utils/programEngine";
import type { MealSection } from "@/types/nutrition";

type Tab = "meal" | "activity";

const tabs: PillTabBarItem<Tab>[] = [
  { id: "meal", label: "وعده غذایی", icon: UtensilsCrossed },
  { id: "activity", label: "فعالیت", icon: Activity },
];

// Where calories eaten and exercise/activity done get logged. This page
// replaces the old settings hub (its nav shortcuts all now live in
// SideMenu/ProfilePage).
export default function DailyLogPage() {
  const [tab, setTab] = useState<Tab>("meal");

  return (
    <div>
      <h1 className="px-5 pt-10 text-center text-2xl font-bold text-white">
        ثبت روزانه
      </h1>

      <PillTabBar
        items={tabs}
        active={tab}
        onChange={setTab}
        layoutId="daily-log-tab-selection"
      />

      {tab === "meal" ? (
        <MealLogTab />
      ) : (
        <div className="flex min-h-[40vh] flex-col items-center justify-center px-5 text-center">
          <p className="text-white">این بخش به‌زودی اضافه می‌شود.</p>
        </div>
      )}
    </div>
  );
}

function MealLogTab() {
  const navigate = useNavigate();
  const [nutritionModalMeal, setNutritionModalMeal] =
    useState<MealSection | null>(null);

  const started = hasProgramStarted();
  const plan = started ? getCurrentMealPlan() : null;

  const enabledMeals = (plan?.meals ?? []).filter(
    (meal) => (meal.enabled ?? true) && meal.foods.length > 0,
  );

  if (!started || enabledMeals.length === 0) {
    return (
      <div className="space-y-4 px-5 pb-5 pt-6 text-center">
        <div className="glass-panel rounded-2xl p-6">
          <p className="text-white">شما برنامه غذایی انتخاب نکردین</p>

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
    <div className="space-y-4 px-5 pb-5 pt-6">
      {enabledMeals.map((meal) => (
        <MealLogCard
          key={meal.id}
          meal={meal}
          onShowNutrition={setNutritionModalMeal}
        />
      ))}

      <MealNutritionModal
        meal={nutritionModalMeal}
        onClose={() => setNutritionModalMeal(null)}
      />
    </div>
  );
}
