import { Beef } from "lucide-react";

import {
  calculateProteinTarget,
  getCalorieGoal,
  proteinStanding,
  type ProteinStanding,
} from "@/utils/calorieEngine";
import { getTodaysTotalProtein } from "@/utils/dailyLogEngine";
import { getLatestWeight } from "@/utils/weightEngine";
import { toFaDigits } from "@/utils/numberFormat";

// Same standing colors MealLogCard/DailyTotalsCard already use for the
// protein ring — reused rather than picked fresh, so "کم/در محدوده/بیشتر
// از حد" means the same color everywhere protein status shows up.
const STANDING_COLOR: Record<ProteinStanding, string> = {
  under: "#f87171",
  onTarget: "#4ade80",
  over: "#fcd34d",
};

// The bar's own fill — always this color regardless of standing, since
// it's answering a different question than the colored numbers around it
// (how far along today is, not whether that's good or bad).
const BAR_COLOR = "#ef4444";

export default function ProteinProgressRow() {
  const weight = getLatestWeight();
  const consumed = getTodaysTotalProtein();

  const target =
    weight !== null
      ? calculateProteinTarget(weight, getCalorieGoal() ?? "maintain")
      : null;

  if (target === null) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
        <Beef size={20} className="text-white/40" />
        <p className="text-xs leading-5 text-white/50">
          برای هدف پروتئین، اول وزنت رو ثبت کن
        </p>
      </div>
    );
  }

  const standing = proteinStanding(consumed, target);
  const standingColor = STANDING_COLOR[standing];

  // Can't have negative "left" — once the target's covered, more protein
  // isn't a problem (see proteinStanding's own headroom), so this reads
  // ۰ گرم مانده rather than a number that would look like overshooting is
  // being punished.
  const remainingGrams = Math.max(0, target.grams - consumed);

  const barFraction = Math.min(1, target.grams > 0 ? consumed / target.grams : 0);

  return (
    <div className="flex h-full flex-col justify-center gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Beef size={18} className="text-white/70" />
          <span className="text-sm font-semibold text-white">پروتئین</span>
        </div>

        <span
          className="text-sm font-bold"
          style={{ color: standingColor }}
        >
          {toFaDigits(remainingGrams)} گرم مانده
        </span>
      </div>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${barFraction * 100}%`, backgroundColor: BAR_COLOR }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-white/50">
        <span>دریافت شده: {toFaDigits(consumed)} گرم</span>
        <span>مجاز: {toFaDigits(target.grams)} گرم</span>
      </div>
    </div>
  );
}
