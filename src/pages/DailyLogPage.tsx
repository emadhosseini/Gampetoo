import { useState } from "react";
import { Activity, UtensilsCrossed } from "lucide-react";

import PillTabBar, { type PillTabBarItem } from "@/components/PillTabBar";
import MealLogCard from "@/components/nutrition/MealLogCard";
import AddMealEntryModal from "@/components/nutrition/AddMealEntryModal";
import MealNutritionModal from "@/components/nutrition/MealNutritionModal";
import { getMealSlots, type MealSlot } from "@/data/nutrition/foodCatalog";

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

// Fully independent of the prescribed nutrition plan (program.nutrition) —
// this logs whatever the user actually ate, freely typed in, against a
// fixed catalog of meal-time slots (صبحانه، ناهار، ...) rather than
// whatever foods happen to be assigned in their plan.
function MealLogTab() {
  const [addModalMeal, setAddModalMeal] = useState<MealSlot | null>(null);
  const [nutritionModalMeal, setNutritionModalMeal] =
    useState<MealSlot | null>(null);
  // Bumped to force MealLogCard's totals to re-read storage after the add
  // modal changes something — there's no shared reactive store.
  const [version, setVersion] = useState(0);

  const mealSlots = getMealSlots();

  return (
    <div className="space-y-4 px-5 pb-5 pt-6">
      {mealSlots.map((meal) => (
        <MealLogCard
          key={`${meal.id}-${version}`}
          meal={meal}
          onAdd={setAddModalMeal}
          onShowNutrition={setNutritionModalMeal}
        />
      ))}

      <AddMealEntryModal
        meal={addModalMeal}
        onClose={() => setAddModalMeal(null)}
        onChange={() => setVersion((v) => v + 1)}
      />

      <MealNutritionModal
        meal={nutritionModalMeal}
        onClose={() => setNutritionModalMeal(null)}
      />
    </div>
  );
}
