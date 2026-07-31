import { useState } from "react";
import { motion } from "framer-motion";
import { Dumbbell, UtensilsCrossed } from "lucide-react";

import WorkoutPage from "./WorkoutPage";
import NutritionPage from "./NutritionPage";

type Tab = "workout" | "nutrition";

const tabs: { id: Tab; label: string; icon: typeof Dumbbell }[] = [
  { id: "workout", label: "برنامه تمرینی", icon: Dumbbell },
  { id: "nutrition", label: "برنامه غذایی", icon: UtensilsCrossed },
];

// Same iOS-tab-bar recipe as BottomNavigation.tsx (glass-panel pill, sliding
// selection via a shared framer-motion layoutId) so this reads as one
// consistent component language — just switching local state between the
// workout/nutrition pages instead of navigating routes. A different layoutId
// keeps its slide animation independent from the real bottom nav's.
export default function DailyProgramPage() {
  const [tab, setTab] = useState<Tab>("workout");

  return (
    <div>
      <div className="px-5.25 pt-10">
        <div className="glass-panel mx-auto max-w-md rounded-full">
          <nav className="relative flex h-17 items-center justify-around overflow-hidden rounded-full">
            {tabs.map((item) => {
              const Icon = item.icon;
              const isActive = tab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className="relative z-10 flex h-full flex-1 items-center justify-center [-webkit-tap-highlight-color:transparent] touch-manipulation"
                >
                  {isActive && (
                    <motion.div
                      layoutId="daily-program-tab-selection"
                      className="absolute inset-1 rounded-full bg-white/10"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 32,
                      }}
                    />
                  )}

                  <span
                    className={`relative flex flex-col items-center gap-1 text-xs transition-[color,transform] duration-150 active:scale-95 ${
                      isActive ? "text-avocado-yellow" : "text-white"
                    }`}
                  >
                    <Icon size={22} />
                    <span>{item.label}</span>
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {tab === "workout" ? <WorkoutPage /> : <NutritionPage />}
    </div>
  );
}
