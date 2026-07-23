import type { FoodItem } from "../../types/nutrition";
import { toFaDigits } from "@/utils/numberFormat";

interface MealItemProps {
  item: FoodItem;
}

export default function MealItem({ item }: MealItemProps) {
  return (
    <div className="glass-chip grid grid-cols-3 items-center rounded-xl px-4 py-3">
      <span className="text-sm text-white">
        {item.name}
      </span>

      <span className="text-center text-sm text-white">
        {item.calories !== undefined && `${toFaDigits(item.calories)} کیلوکالری`}
      </span>

      <span className="text-left text-sm font-semibold text-white">
        {toFaDigits(item.amount)}
      </span>
    </div>
  );
}
