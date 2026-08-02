import { useState } from "react";
import { Activity, UtensilsCrossed } from "lucide-react";

import PillTabBar, { type PillTabBarItem } from "@/components/PillTabBar";
import MealLogCard from "@/components/nutrition/MealLogCard";
import MealOverviewModal from "@/components/nutrition/MealOverviewModal";
import AddMealEntryModal from "@/components/nutrition/AddMealEntryModal";
import AiMealEntryModal from "@/components/nutrition/AiMealEntryModal";
import {
  DAILY_MODE_SLOT,
  getMealSlots,
  type MealSlot,
} from "@/data/nutrition/foodCatalog";
import {
  getCalorieTrackingMode,
  setCalorieTrackingMode,
  type CalorieTrackingMode,
} from "@/utils/calorieModeEngine";

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
        <MealTabRoot />
      ) : (
        <div className="flex min-h-[40vh] flex-col items-center justify-center px-5 text-center">
          <p className="text-white">این بخش به‌زودی اضافه می‌شود.</p>
        </div>
      )}
    </div>
  );
}

// Reads the saved calorie-tracking mode and either prompts the user to pick
// one (first visit) or renders MealLogTab with the slot list that mode
// implies. Both modes share the exact same storage/components — the mode
// only decides which slot ids MealLogTab loops over.
function MealTabRoot() {
  const [mode, setMode] = useState(() => getCalorieTrackingMode());

  if (mode === null) {
    return <CalorieModeChoicePrompt onChoose={setMode} />;
  }

  return (
    <MealLogTab slots={mode === "daily" ? [DAILY_MODE_SLOT] : getMealSlots()} />
  );
}

function CalorieModeChoicePrompt({
  onChoose,
}: {
  onChoose: (mode: CalorieTrackingMode) => void;
}) {
  function choose(mode: CalorieTrackingMode) {
    setCalorieTrackingMode(mode);
    onChoose(mode);
  }

  return (
    <div className="space-y-4 px-5 pb-5 pt-6 text-center">
      <p className="text-white">
        اول انتخاب کن که می‌خوای کالری رو چه‌طوری ثبت کنی — هر وقت خواستی
        از منوی کناری می‌تونی عوضش کنی.
      </p>

      <div className="flex gap-3">
        <button
          onClick={() => choose("perMeal")}
          className="glass-tap selector-pill flex-1 rounded-xl py-4 font-bold text-white"
        >
          وعده‌ای
        </button>

        <button
          onClick={() => choose("daily")}
          className="glass-tap selector-pill flex-1 rounded-xl py-4 font-bold text-white"
        >
          روزانه
        </button>
      </div>
    </div>
  );
}

type ModalScreen = { meal: MealSlot; screen: "overview" | "add" | "ai" } | null;

// Fully independent of the prescribed nutrition plan (program.nutrition) —
// this logs whatever the user actually ate against a fixed catalog of
// meal-time slots (صبحانه، ناهار، ...), or a single unified slot for
// "daily" mode. Tapping a whole card opens an overview of what's already
// logged for it; the overview's two "افزودن" buttons each drill one level
// deeper — either the manual food-search screen (AddMealEntryModal) or the
// AI free-text screen (AiMealEntryModal). "بستن" on either add screen
// closes everything straight back to this list, not just one level back to
// the overview — closing there means "I'm done", not "go back".
function MealLogTab({ slots }: { slots: MealSlot[] }) {
  const [modal, setModal] = useState<ModalScreen>(null);
  // Bumped after every add/remove so the cards (whose own state was read
  // before the modal opened) show fresh totals once everything closes.
  const [version, setVersion] = useState(0);

  return (
    <div className="space-y-4 px-5 pb-5 pt-6">
      {slots.map((meal) => (
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
        onAddAi={() => setModal(modal && { meal: modal.meal, screen: "ai" })}
        onChange={() => setVersion((v) => v + 1)}
      />

      <AddMealEntryModal
        meal={modal?.screen === "add" ? modal.meal : null}
        onClose={() => setModal(null)}
        onChange={() => setVersion((v) => v + 1)}
      />

      <AiMealEntryModal
        meal={modal?.screen === "ai" ? modal.meal : null}
        onClose={() => setModal(null)}
      />
    </div>
  );
}
