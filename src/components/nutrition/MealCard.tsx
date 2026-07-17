import MealItem from "./ٖMealItem";
import type { MealSection } from "../../types/nutrition";

interface MealCardProps {
  meal: MealSection;
}

export default function MealCard({ meal }: MealCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{meal.icon}</span>

        <h2 className="text-lg font-semibold text-white">
          {meal.title}
        </h2>
      </div>

      <div className="space-y-2">
        {meal.foods.map((food) => (
          <MealItem key={food.id} item={food} />
        ))}
      </div>

      {(meal.calories || meal.protein) && (
        <div className="flex items-center gap-4 pt-2 text-sm">
          {meal.calories && (
            <span className="text-orange-400">
              {meal.calories} kcal
            </span>
          )}

          {meal.protein && (
            <span className="text-emerald-400">
              {meal.protein} g پروتئین
            </span>
          )}
        </div>
      )}

      {meal.notes && meal.notes.length > 0 && (
        <div className="rounded-xl bg-zinc-800/60 p-3">
          <div className="mb-2 text-xs font-semibold text-zinc-400">
            نکات
          </div>

          <ul className="space-y-1">
            {meal.notes.map((note, index) => (
              <li
                key={index}
                className="text-sm text-zinc-200"
              >
                • {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}