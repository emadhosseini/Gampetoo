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
    <div className="glass-panel rounded-2xl p-5">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="grid w-full grid-cols-[24px_1fr_24px] items-center"
      >
        <span />

        <span className="flex items-center justify-center gap-3">
          <span className="text-2xl">🔄</span>

          <h2 className="text-lg font-semibold text-white">
            جایگزین‌های غذایی
          </h2>
        </span>

        <ChevronDown
          className={`h-5 w-5 text-zinc-200 transition-transform ${
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
