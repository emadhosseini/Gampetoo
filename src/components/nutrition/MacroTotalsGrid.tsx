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
  // Only protein is ever judged against a target, so it's the only one of
  // the four that can get its own ring — pass null/undefined when there's
  // no target to judge it against yet.
  proteinStanding?: ProteinStanding | null;
  className?: string;
}

// The four macros as a row of single-line capsules. Protein gets its own
// ring when a standing is given, since it's the one figure here judged
// against anything.
export default function MacroTotalsGrid({
  totals,
  proteinStanding,
  className = "",
}: MacroTotalsGridProps) {
  return (
    // No wrapping chip of its own any more — four capsules sitting directly
    // in the card that holds them, each with its value stacked under its
    // label so a long one ("کربوهیدرات") gets the pill's full width to
    // itself instead of sharing the line with a number.
    <div className={`grid grid-cols-4 gap-1 ${className}`}>
      {MACRO_FIELDS.map((field) => (
        <div
          key={field.key}
          className={`glass-chip glass-static flex min-w-0 flex-col items-center justify-center rounded-full px-1.5 py-1.5 ${
            field.key === "protein" && proteinStanding
              ? PROTEIN_RING[proteinStanding]
              : ""
          }`}
        >
          <span className="max-w-full truncate text-[10px] leading-tight text-white/60">
            {field.label}
          </span>
          <span className="text-xs font-bold leading-tight text-white">
            {toFaDigits(totals[field.key])}
          </span>
        </div>
      ))}
    </div>
  );
}
