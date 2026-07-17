import type { FoodItem } from "../../types/nutrition";

interface MealItemProps {
  item: FoodItem;
}

export default function MealItem({ item }: MealItemProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3">
      <span className="text-sm text-zinc-100">
        {item.name}
      </span>

      <span className="text-sm font-semibold text-emerald-400">
        {item.amount}
      </span>
    </div>
  );
}