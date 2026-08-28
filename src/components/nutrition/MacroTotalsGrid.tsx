import type { ProteinStanding } from "@/utils/calorieEngine";
import { toFaDigits } from "@/utils/numberFormat";

// Matches MealLogCard/DailyTotalsCard's ring colors: red is short, green is
// there, amber is past the point of it doing anything more. Plain classes,
// not Tailwind's ring-2 ring-{color} utilities — see index.css's
// .protein-ring-* comment for why those render nothing on a .glass-chip.
const PROTEIN_RING: Record<ProteinStanding, string> = {
  under: "protein-ring-under",
  onTarget: "protein-ring-on-target",
  over: "protein-ring-over",
};

const MACRO_FIELDS = [
  { key: "protein", label: "پروتئین" },
  { key: "carbs", label: "کربوهیدرات" },
  { key: "fat", label: "چربی" },
  { key: "fiber", label: "فیبر" },
] as const;

export interface MacroTotals {
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface MacroTotalsGridProps {
  totals: MacroTotals;
  // Any of the four can get its own ring, but only when there's an actual
  // target to judge it against — protein's comes from the bodyweight/goal
  // calculation, carbs/fat/fiber's from the manual macro targets. Pass
  // null/undefined per-key while that macro has no target set.
  standings?: Partial<Record<keyof MacroTotals, ProteinStanding | null>>;
  className?: string;
}

// The four macros as a row of single-line capsules. Each gets its own ring
// when a standing is given for it, since that's the figure here judged
// against a target.
export default function MacroTotalsGrid({
  totals,
  standings,
  className = "",
}: MacroTotalsGridProps) {
  return (
    // No wrapping chip of its own any more — four capsules sitting directly
    // in the card that holds them, each with its value stacked under its
    // label so a long one ("کربوهیدرات") gets the pill's full width to
    // itself instead of sharing the line with a number.
    <div className={`grid grid-cols-4 gap-1 ${className}`}>
      {MACRO_FIELDS.map((field) => {
        const standing = standings?.[field.key];

        return (
          <div
            key={field.key}
            className={`glass-chip glass-static flex min-w-0 flex-col items-center justify-center rounded-full px-1.5 py-1.5 ${
              standing ? PROTEIN_RING[standing] : ""
            }`}
          >
            <span className="max-w-full truncate text-[10px] leading-tight text-white/60">
              {field.label}
            </span>
            <span className="text-xs font-bold leading-tight text-white">
              {toFaDigits(totals[field.key])}
            </span>
          </div>
        );
      })}
    </div>
  );
}
