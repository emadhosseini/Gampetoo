import { useState } from "react";
import { Activity, UtensilsCrossed } from "lucide-react";

import PillTabBar, { type PillTabBarItem } from "@/components/PillTabBar";
import MealLogCard from "@/components/nutrition/MealLogCard";
import MealOverviewModal from "@/components/nutrition/MealOverviewModal";
import AddMealEntryModal from "@/components/nutrition/AddMealEntryModal";
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

type ModalScreen = { meal: MealSlot; screen: "overview" | "add" } | null;

// Fully independent of the prescribed nutrition plan (program.nutrition) —
// this logs whatever the user actually ate against a fixed catalog of
// meal-time slots (صبحانه، ناهار، ...). Tapping a whole card opens an
// overview of what's already logged for it; "افزودن" there drills one level
// deeper into the actual food-search screen.
function MealLogTab() {
  const [modal, setModal] = useState<ModalScreen>(null);
  // Bumped after every add/remove so the cards (whose own state was read
  // before the modal opened) show fresh totals once everything closes.
  const [version, setVersion] = useState(0);

  const mealSlots = getMealSlots();

  return (
    <div className="space-y-4 px-5 pb-5 pt-6">
      {mealSlots.map((meal) => (
        <MealLogCard
          key={`${meal.id}-${version}`}
          meal={meal}
          onOpen={(meal) => setModal({ meal, screen: "overview" })}
          onAdd={(meal) => setModal({ meal, screen: "add" })}
        />
      ))}

      <MealOverviewModal
        meal={modal?.screen === "overview" ? modal.meal : null}
        onClose={() => setModal(null)}
        onAdd={() => setModal(modal && { meal: modal.meal, screen: "add" })}
        onChange={() => setVersion((v) => v + 1)}
      />

      <AddMealEntryModal
        meal={modal?.screen === "add" ? modal.meal : null}
        onClose={() =>
          setModal(modal && { meal: modal.meal, screen: "overview" })
        }
        onChange={() => setVersion((v) => v + 1)}
      />
    </div>
  );
}
