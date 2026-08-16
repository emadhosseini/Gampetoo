import type { FoodItem } from "../../types/nutrition";
import { toFaDigits } from "@/utils/numberFormat";

interface MealItemProps {
  item: FoodItem;
  // When given, the row becomes a button that offers to log this food as
  // eaten (NutritionPage). Left out, it stays the plain read-only row it
  // has always been.
  onSelect?: (item: FoodItem) => void;
}

export default function MealItem({ item, onSelect }: MealItemProps) {
  const content = (
    <>
      <span className="text-sm text-white">
        {item.name}
      </span>

      <span className="text-center text-sm text-white">
        {item.calories !== undefined && `${toFaDigits(item.calories)} کیلوکالری`}
      </span>

      <span className="text-left text-sm font-semibold text-white">
        {toFaDigits(item.amount)}
      </span>
    </>
  );

  const className = "glass-chip grid w-full grid-cols-3 items-center rounded-xl px-4 py-3";

  if (!onSelect) {
    return <div className={className}>{content}</div>;
  }

  return (
    <button
      onClick={() => onSelect(item)}
      aria-label={`ثبت ${item.name} در غذاهای خورده‌شده`}
      className={className}
    >
      {content}
    </button>
  );
}
