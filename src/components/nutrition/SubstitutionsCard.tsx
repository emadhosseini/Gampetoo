import { ChevronDown } from "lucide-react";
import { useState } from "react";

import type { FoodSubstitution } from "../../types/nutrition";

interface SubstitutionsCardProps {
  substitutions: FoodSubstitution[];
}

export default function SubstitutionsCard({
  substitutions,
}: SubstitutionsCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    // Same compact-card treatment as MealCard: p-2.5 + text-sm matches
    // WeeklyScheduleModal's "تقویم هفته" button height, glass-static drops
    // the press-scale a plain expand-in-place card shouldn't have.
    <div className="glass-panel glass-static rounded-2xl p-2.5">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="grid w-full grid-cols-[24px_1fr_24px] items-center"
      >
        <span />

        <span className="flex items-center justify-center gap-2">
          <span className="text-lg">🔄</span>

          <h2 className="text-sm font-bold text-white">جایگزین‌های غذایی</h2>
        </span>

        <ChevronDown
          className={`h-4 w-4 text-zinc-200 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="mt-4 space-y-5">
          {substitutions.map((group) => (
            <div key={group.title}>
              <h3 className="mb-2 font-semibold text-white">
                {group.title}
              </h3>

              <ul className="space-y-1 text-white">
                {group.foods.map((food) => (
                  <li key={food}>• {food}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
