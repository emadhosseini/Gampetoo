import { useState } from "react";
import { Dumbbell, UtensilsCrossed } from "lucide-react";

import PillTabBar, { type PillTabBarItem } from "@/components/PillTabBar";
import WeeklyScheduleModal from "@/components/WeeklyScheduleModal";

import WorkoutPage from "./WorkoutPage";
import NutritionPage from "./NutritionPage";

type Tab = "workout" | "nutrition";

const tabs: PillTabBarItem<Tab>[] = [
  { id: "workout", label: "برنامه تمرینی", icon: Dumbbell },
  { id: "nutrition", label: "برنامه غذایی", icon: UtensilsCrossed },
];

export default function DailyProgramPage() {
  const [tab, setTab] = useState<Tab>("workout");

  return (
    <div>
      <PillTabBar
        items={tabs}
        active={tab}
        onChange={setTab}
        layoutId="daily-program-tab-selection"
      />

      {tab === "workout" && (
        <div className="px-5 pt-3">
          <WeeklyScheduleModal />
        </div>
      )}

      {tab === "workout" ? <WorkoutPage /> : <NutritionPage />}
    </div>
  );
}
