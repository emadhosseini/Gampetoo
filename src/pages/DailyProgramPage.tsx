import { useState } from "react";
import { Activity, Dumbbell, UtensilsCrossed } from "lucide-react";

import PillTabBar, { type PillTabBarItem } from "@/components/PillTabBar";
import ActivityTabRoot from "@/components/progress/ActivityTabRoot";
import { isNativeIos } from "@/native/platform";

import WorkoutPage from "./WorkoutPage";
import NutritionPage from "./NutritionPage";

type WebTab = "workout" | "nutrition";
type IosTab = "workout" | "activity";

const webTabs: PillTabBarItem<WebTab>[] = [
  { id: "workout", label: "برنامه تمرینی", icon: Dumbbell },
  { id: "nutrition", label: "برنامه غذایی", icon: UtensilsCrossed },
];

const iosTabs: PillTabBarItem<IosTab>[] = [
  { id: "workout", label: "برنامه تمرینی", icon: Dumbbell },
  { id: "activity", label: "فعالیت", icon: Activity },
];

export default function DailyProgramPage() {
  const nativeIos = isNativeIos();
  const [webTab, setWebTab] = useState<WebTab>("workout");
  const [iosTab, setIosTab] = useState<IosTab>("workout");

  if (nativeIos) {
    return (
      <div>
        <PillTabBar
          items={iosTabs}
          active={iosTab}
          onChange={setIosTab}
          layoutId="daily-program-tab-selection"
        />

        {iosTab === "workout" ? <WorkoutPage /> : <ActivityTabRoot />}
      </div>
    );
  }

  return (
    <div>
      <PillTabBar
        items={webTabs}
        active={webTab}
        onChange={setWebTab}
        layoutId="daily-program-tab-selection"
      />

      {webTab === "workout" ? <WorkoutPage /> : <NutritionPage />}
    </div>
  );
}
