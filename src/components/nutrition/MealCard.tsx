import { ChevronDown } from "lucide-react";
import { useState } from "react";

import MealItem from "./MealItem";
import type { MealSection } from "../../types/nutrition";

interface MealCardProps {
  meal: MealSection;
}

export default function MealCard({ meal }: MealCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="glass-panel rounded-2xl p-5">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="grid w-full grid-cols-[24px_1fr_24px] items-center"
      >
        <span />

        <span className="flex items-center justify-center gap-3">
          <span className="text-2xl">{meal.icon}</span>

          <h2 className="text-lg font-semibold text-white">
            {meal.title}
          </h2>
        </span>

        <ChevronDown
          className={`h-5 w-5 text-zinc-200 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            {meal.foods.map((food) => (
              <MealItem key={food.id} item={food} />
            ))}
          </div>

          {(meal.calories || meal.protein) && (
            <div className="flex items-center gap-4 pt-2 text-sm">
              {meal.calories && (
                <span className="text-white">
                  {meal.calories} کیلوکالری
                </span>
              )}

              {meal.protein && (
                <span className="font-semibold text-white">
                  {meal.protein} گرم پروتئین
                </span>
              )}
            </div>
          )}

          {meal.notes && meal.notes.length > 0 && (
            <div className="glass-chip rounded-xl p-3">
              <div className="mb-2 text-xs font-semibold text-white">
                نکات
              </div>

              <ul className="space-y-1">
                {meal.notes.map((note, index) => (
                  <li
                    key={index}
                    className="text-sm text-white"
                  >
                    • {note}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
