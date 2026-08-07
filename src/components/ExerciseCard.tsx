import { motion } from "framer-motion";

import Toggle from "@/components/Toggle";
import type { Exercise } from "@/data/workoutLibrary";
import { toFaDigits } from "@/utils/numberFormat";

type ExerciseCardProps = {
  exercise: Exercise;
  checked: boolean;
  onToggleChecked: () => void;
};

export default function ExerciseCard({
  exercise,
  checked,
  onToggleChecked,
}: ExerciseCardProps) {
  return (
    // `layout` animates the position shift when checking this off moves it
    // past its still-to-do siblings in the parent's sorted list — a plain
    // re-render would otherwise just snap it straight to the bottom.
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className={`glass-panel flex items-center gap-4 rounded-3xl p-4 transition-opacity ${
        checked ? "opacity-50" : ""
      }`}
    >
      <div className="flex-1">
        <h2 className="text-lg font-bold text-white">
          {exercise.name}
        </h2>

        <p className="mt-2 text-sm text-white">{toFaDigits(exercise.sets)} ست</p>
      </div>

      {/* Reps/seconds sits under the toggle rather than beside the sets
          count — with the toggle now here, a justify-between row cramming
          both numbers into the name's own column read as cluttered. This
          reads as one unit: what you're marking done, and how much of it. */}
      <div className="flex shrink-0 flex-col items-center gap-1.5">
        <Toggle checked={checked} onChange={onToggleChecked} />
        <span className="text-xs text-white/60">
          {toFaDigits(exercise.reps)}{" "}
          {exercise.unit === "seconds" ? "ثانیه" : "تکرار"}
        </span>
      </div>
    </motion.div>
  );
}
