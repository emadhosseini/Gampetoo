import type { FoodItem } from "../../types/nutrition";

interface MealItemProps {
  item: FoodItem;
}

export default function MealItem({ item }: MealItemProps) {
  return (
    <div className="grid grid-cols-3 items-center rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3">
      <span className="text-sm text-zinc-100">
        {item.name}
      </span>

      <span className="text-center text-sm text-orange-400">
        {item.calories !== undefined && `${item.calories} کیلوکالری`}
      </span>

      <span className="text-left text-sm font-semibold text-emerald-400">
        {item.amount}
      </span>
    </div>
  );
}
