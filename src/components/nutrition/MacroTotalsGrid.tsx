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

// The four macros as one merged card, not four separate floating chips —
// each used to be its own .glass-chip box, which read as four unrelated
// cards sitting side by side rather than one breakdown of the same total.
// Protein still gets its own small ring inside the merged card when a
// standing is given, since it's the one figure here judged against
// anything.
export default function MacroTotalsGrid({
  totals,
  proteinStanding,
  className = "",
}: MacroTotalsGridProps) {
  return (
    <div className={`glass-chip rounded-2xl p-2 ${className}`}>
      <div className="grid grid-cols-4 gap-1">
        {MACRO_FIELDS.map((field) => (
          <div
            key={field.key}
            className={`rounded-xl py-3 text-center ${
              field.key === "protein" && proteinStanding
                ? PROTEIN_RING[proteinStanding]
                : ""
            }`}
          >
            <p className="text-xs text-white/60">{field.label}</p>
            <p className="mt-1 text-sm font-bold text-white">
              {toFaDigits(totals[field.key])}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
